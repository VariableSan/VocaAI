import { defineStore } from 'pinia'
import type { Grade } from 'ts-fsrs'
import { createEmptyCard, FSRS, generatorParameters } from 'ts-fsrs'
import { FSRS_PARAMETERS, StorageError, type Card, type Deck } from '~/shared'
import { IndexedDBStorage } from '~/shared/storage/services/indexeddb'

export const useCardStore = defineStore('cards', () => {
	const logger = useCustomLogger('useCardStore')

	// TODO: Allow the user to select storage
	const storage = new IndexedDBStorage()
	const fsrs = new FSRS(generatorParameters(FSRS_PARAMETERS))

	const cards = ref<Card[]>([])
	const decks = ref<Deck[]>([])
	const currentDeck = ref<Deck | null>(null)
	const loading = ref(false)
	const initialized = ref(false)

	async function loadDecks() {
		decks.value = await storage.getDecks()
	}

	/**
	 * Loads cards for a specific deck and sets it as the current deck.
	 * @throws {StorageError} When no deck exists with the provided ID
	 */
	async function loadCardsForDeck(deckId: string) {
		const deck = await storage.getDeck(deckId)

		if (!deck) {
			throw new StorageError('There is no deck with this ID')
		}

		currentDeck.value = deck
		cards.value = await storage.getCardsForDeck(deck.id)
	}

	async function addDeck(name: string, icon: string) {
		const deck = await storage.addDeck(name, icon)
		decks.value.push(deck)
	}

	/**
	 * Adds a new card to the current deck.
	 * @throws {StorageError} If no deck is currently selected
	 */
	async function addCard(front: string, back: string) {
		if (!currentDeck.value) {
			throw new StorageError('No deck selected')
		}

		const date = new Date()
		const card: Card = {
			...createEmptyCard(),
			id: crypto.randomUUID(),
			deckId: currentDeck.value.id,
			front,
			back,
			created: date.getTime(),
			modified: date.getTime(),
		}

		await storage.saveCard(card)
		cards.value.push(card)
	}

	async function reviewCard(cardId: string, grade: Grade) {
		// TODO: optimize this
		const card = cards.value.find((c) => c.id === cardId)
		if (!card) return

		const dateNow = Date.now()
		const newState = fsrs.next(card, dateNow, grade)
		const updatedCard: Card = {
			...card,
			...newState.card,
			modified: dateNow,
		}

		await storage.saveCard(updatedCard)
		Object.assign(card, updatedCard)
	}

	async function clearDatabase() {
		try {
			await storage.clearDatabase()
			cards.value = []
		} catch (e) {
			logger.error(e)
		}
	}

	async function init() {
		loading.value = true
		try {
			await storage.init()
			await loadDecks()
			initialized.value = true
		} catch (e) {
			logger.error(e)
		} finally {
			loading.value = false
		}
	}

	onMounted(() => {
		init()
	})

	return {
		cards,
		decks,
		currentDeck,
		loading,
		initialized,
		loadDecks,
		loadCardsForDeck,
		addDeck,
		addCard,
		reviewCard,
		clearDatabase,
	}
})
