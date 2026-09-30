const databaseName = 'globalstay-media'
const storeName = 'listing-videos'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Le stockage vidéo n’est pas disponible dans ce navigateur.'))
      return
    }

    const request = window.indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Ouverture de la base vidéo impossible.'))
  })
}

export async function saveListingVideo(listingId: number, file: File): Promise<void> {
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put(file, listingId)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Enregistrement vidéo impossible.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Enregistrement vidéo interrompu.'))
    })
  } finally {
    database.close()
  }
}

export async function loadListingVideo(listingId: number): Promise<Blob | null> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(listingId)
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
      request.onerror = () => reject(request.error ?? new Error('Lecture vidéo impossible.'))
    })
  } finally {
    database.close()
  }
}