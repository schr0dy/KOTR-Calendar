import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { UserProfile, Team } from './types'

// ─── Auth ───────────────────────────────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    uid: snap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as UserProfile
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists()) {
      callback(null)
      return
    }
    const data = snap.data()
    callback({
      ...data,
      uid: snap.id,
      createdAt: data.createdAt?.toDate() ?? new Date(),
    } as UserProfile)
  })
}

// Create user account (only Direction/admin can do this via Admin panel)
export async function createUserAccount(
  email: string,
  password: string,
  name: string,
  team: Team,
  createdByUid: string
) {
  // We create via Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const profile: Omit<UserProfile, 'uid'> = {
    email,
    name,
    team,
    role: team === 'direction' ? 'admin' : 'member',
    createdAt: new Date(),
    createdBy: createdByUid,
  }
  await setDoc(doc(db, 'users', cred.user.uid), profile)
  return cred.user
}

// Get all users (admin only)
export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      uid: d.id,
      createdAt: data.createdAt?.toDate() ?? new Date(),
    } as UserProfile
  })
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'team' | 'role'>>
) {
  await updateDoc(doc(db, 'users', uid), updates)
}

export async function deleteUserFromDB(uid: string) {
  await deleteDoc(doc(db, 'users', uid))
}
