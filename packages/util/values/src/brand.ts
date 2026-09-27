declare const brand: unique symbol

/** A string admitted at one boundary and not re-parsed by the callee. */
export type Branded<B extends string> = string & { readonly [brand]: B }
