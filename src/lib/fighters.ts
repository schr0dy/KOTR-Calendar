import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query,
  orderBy, Timestamp, getDocs, writeBatch, runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Fight, FightResult, Fighter, WeightCategory } from './types'

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

export function subscribeToCategories(cb: (c: WeightCategory[]) => void) {
  const q = query(collection(db, 'weightCategories'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: s(data.name),
        championId: s(data.championId),
        createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
      }
    }))
  )
}

export function subscribeToFighters(cb: (f: Fighter[]) => void) {
  return onSnapshot(collection(db, 'fighters'), (snap) =>
    cb(snap.docs.map((d) => {
      const x = d.data()
      const categoryIds = rawCategoryIds(x)
      return {
        id: d.id,
        categoryIds,
        firstName: s(x.firstName),
        lastName: s(x.lastName),
        nickname: s(x.nickname),
        age: s(x.age),
        height: s(x.height),
        reach: s(x.reach),
        weight: s(x.weight),
        stance: s(x.stance),
        nationality: s(x.nationality),
        team: s(x.team),
        photo: s(x.photo),
        notes: s(x.notes),
        // legacy fights (no category) are assigned to the fighter's first category
        fights: ((x.fights as Fight[]) ?? []).map((f) => ({ ...f, categoryId: f.categoryId || categoryIds[0] || '', opponentId: f.opponentId || '' })),
        createdAt: (x.createdAt as Timestamp)?.toDate?.() ?? new Date(),
      }
    }))
  )
}

/** Supports legacy docs that only had a single `categoryId`. */
function rawCategoryIds(x: Record<string, unknown>): string[] {
  if (Array.isArray(x.categoryIds)) return x.categoryIds as string[]
  return x.categoryId ? [s(x.categoryId)] : []
}

export async function createCategory(name: string) {
  await addDoc(collection(db, 'weightCategories'), { name, createdAt: Timestamp.now() })
}

export async function renameCategory(id: string, name: string) {
  await updateDoc(doc(db, 'weightCategories', id), { name })
}

/** Set (or clear with '') the champion of a category. */
export async function setChampion(categoryId: string, fighterId: string) {
  await updateDoc(doc(db, 'weightCategories', categoryId), { championId: fighterId })
}

/** Deleting a category only removes it from fighters' enrolment; fighters and their fight history are kept. */
export async function deleteCategory(id: string) {
  const snap = await getDocs(collection(db, 'fighters'))
  const batch = writeBatch(db)
  snap.docs.forEach((d) => {
    const cats = rawCategoryIds(d.data())
    if (cats.includes(id)) batch.update(d.ref, { categoryIds: cats.filter((c) => c !== id) })
  })
  batch.delete(doc(db, 'weightCategories', id))
  await batch.commit()
}

export type FighterInput = Omit<Fighter, 'id' | 'createdAt'>

export async function createFighter(data: FighterInput) {
  await addDoc(collection(db, 'fighters'), { ...data, createdAt: Timestamp.now() })
}

export async function updateFighter(id: string, data: Partial<FighterInput>) {
  await updateDoc(doc(db, 'fighters', id), { ...data })
}

export async function deleteFighter(id: string) {
  await deleteDoc(doc(db, 'fighters', id))
}

export function getRecord(fights: Fight[]) {
  const wins = fights.filter((f) => f.result === 'win').length
  const losses = fights.filter((f) => f.result === 'loss').length
  const draws = fights.filter((f) => f.result === 'draw').length
  const isKO = (f: Fight) => f.method === 'KO' || f.method === 'TKO'
  const kos = fights.filter((f) => f.result === 'win' && isKO(f)).length
  return { wins, losses, draws, kos, text: `${wins}-${losses}-${draws}` }
}

/** Resize an image file to a small JPEG data URL so it can live inside Firestore. */
export function fileToThumbnail(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')) }
    img.src = url
  })
}

const FINISHES = ['KO', 'TKO', 'Submission', 'Corner Stoppage', 'Doctor Stoppage']

/**
 * Ranking score: win = 3 pts (+1 if by finish), draw = 1, loss = 0.
 * Fights without a date count fully; dated fights older than 3 years count 50%.
 */
export function getScore(fights: Fight[]): number {
  const now = Date.now()
  const THREE_YEARS = 3 * 365 * 24 * 3600 * 1000
  let total = 0
  for (const f of fights) {
    if (f.method === 'No Contest') continue
    let pts = f.result === 'win' ? 3 + (FINISHES.includes(f.method) ? 1 : 0) : f.result === 'draw' ? 1 : 0
    const t = f.date ? Date.parse(f.date) : NaN
    if (!isNaN(t) && now - t > THREE_YEARS) pts *= 0.5
    total += pts
  }
  return total
}

// ─── Linked bouts (a fight is stored on both fighters, mirrored) ─────────────

const mirrorResult = (r: FightResult): FightResult => (r === 'win' ? 'loss' : r === 'loss' ? 'win' : 'draw')

export type BoutInput = Omit<Fight, 'id'>

export async function createFighterReturningId(data: FighterInput): Promise<string> {
  const ref = await addDoc(collection(db, 'fighters'), { ...data, createdAt: Timestamp.now() })
  return ref.id
}

/**
 * Creates or updates a fight on ighterId and writes the mirrored copy on the opponent
 * (same id and same data; result inverted, draw stays draw). Atomic.
 * If the opponent changed on edit, the copy is removed from the previous opponent.
 */
export async function saveBout(
  fighterId: string, fighterName: string, opponentName: string,
  fightId: string | null, fight: BoutInput
): Promise<void> {
  if (!fight.opponentId || fight.opponentId === fighterId) throw new Error('Invalid opponent')
  const id = fightId ?? crypto.randomUUID()
  const refA = doc(db, 'fighters', fighterId)
  const refB = doc(db, 'fighters', fight.opponentId)

  await runTransaction(db, async (tx) => {
    const snapA = await tx.get(refA)
    const snapB = await tx.get(refB)
    const prev = ((snapA.data()?.fights as Fight[]) ?? []).find((f) => f.id === id)
    const oldOppId = prev?.opponentId && prev.opponentId !== fight.opponentId ? prev.opponentId : ''
    const snapOld = oldOppId ? await tx.get(doc(db, 'fighters', oldOppId)) : null

    const fightsA = ((snapA.data()?.fights as Fight[]) ?? []).filter((f) => f.id !== id)
    fightsA.push({ ...fight, id, opponent: opponentName })

    const dataB = snapB.data() ?? {}
    const fightsB = ((dataB.fights as Fight[]) ?? []).filter((f) => f.id !== id)
    fightsB.push({
      ...fight, id, result: mirrorResult(fight.result),
      opponentId: fighterId, opponent: fighterName,
    })
    // make sure the opponent is enrolled in the category the fight was fought in
    const catsB = rawCategoryIds(dataB)
    const updB: Record<string, unknown> = { fights: fightsB }
    if (fight.categoryId && !catsB.includes(fight.categoryId)) updB.categoryIds = [...catsB, fight.categoryId]

    tx.update(refA, { fights: fightsA })
    tx.update(refB, updB)
    if (snapOld?.exists()) {
      tx.update(snapOld.ref, { fights: ((snapOld.data().fights as Fight[]) ?? []).filter((f) => f.id !== id) })
    }
  })
}

/** Deletes a fight from the fighter and, if linked, from the opponent too. */
export async function deleteBout(fighterId: string, fightId: string): Promise<void> {
  const refA = doc(db, 'fighters', fighterId)
  await runTransaction(db, async (tx) => {
    const snapA = await tx.get(refA)
    const fightsA = (snapA.data()?.fights as Fight[]) ?? []
    const target = fightsA.find((f) => f.id === fightId)
    const snapB = target?.opponentId ? await tx.get(doc(db, 'fighters', target.opponentId)) : null
    tx.update(refA, { fights: fightsA.filter((f) => f.id !== fightId) })
    if (snapB?.exists()) {
      tx.update(snapB.ref, { fights: ((snapB.data().fights as Fight[]) ?? []).filter((f) => f.id !== fightId) })
    }
  })
}
