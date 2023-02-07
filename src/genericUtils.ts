export class Optional<T> {
    private readonly value: T | null;

    constructor(value?: T | null) {
        this.value = value === undefined ? null : value;
    }

    get(): T {
        if (this.value === null)
            throw Error("Can't retrieve value from empty optional");
        return this.value
    }

    map<U>(f: (T) => U): Optional<U> {
        if (this.value === null) return Optional.empty();
        return new Optional(f.apply(this.value));
    }

    or(v: T): T {
        return this.value === null ? v : this.value;
    }

    isEmpty(): boolean {
        return this.value === null;
    }

    static empty<T>() {
        return new Optional<T>(null);
    }
}