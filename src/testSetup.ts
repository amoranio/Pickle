// Isolate browser storage from Node 25+'s native, file-backed storage globals.
class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(String(key)) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(String(key));
  }
  setItem(key: string, value: string) {
    this.values.set(String(key), String(value));
  }
}
Object.defineProperty(globalThis, "Storage", {
  configurable: true,
  value: MemoryStorage,
});
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
});
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: new MemoryStorage(),
});
