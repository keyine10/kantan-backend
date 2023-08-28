/**
 * Represents the data of an active user.
 */
export interface ActiveUserData {
	/**
	 * The subject of the token. The value of this property is the user's ID.
	 */
	sub: number;

	/**
	 * The user's email address.
	 */
	email: string;
}
