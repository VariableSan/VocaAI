import type { Card, Deck } from '../lib/types'

export abstract class AbstractStorageService {
	abstract init(): Promise<void>
	abstract clearDatabase(): Promise<void>

	abstract getCard(id: string): Promise<Card | null>
	abstract getCards(): Promise<Card[]>
	abstract saveCard(card: Card): Promise<void>

	abstract getDeck(id: string): Promise<Deck | null>
	abstract getDecks(): Promise<Deck[]>
	abstract saveDeck(deck: Deck): Promise<void>

	abstract getCardsForDeck(deckId: string): Promise<Card[]>
	abstract clearDeckCards(deckId: string): Promise<void>
}
