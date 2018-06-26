'use strict';

/** A simple injector module, is exactly a HashMap. */
class Injector {

    /** Internal mapping */
    private singletonMap: any = {};

    /** 
     * Request the singleton with given name.
     * @param name - The name to give this singleton.
     * @returns - The object with that name.
     */
    public request<T>(name: string): T {
        if (!this.singletonMap[name]) {
            throw new Error(`No object with name ${name} was loaded.`);
        }

        return this.singletonMap[name];
    }

    /** 
     * Put a singleton into memory. 
     * @param singleton - The singleton object to store.
     * @param name - The name to give the singleton you're storing.
     */
    public put(singleton: any, name: string): void {
        if (this.singletonMap[name]) {
            throw new Error(`An object with name ${name} already exists.`);
        }

        this.singletonMap[name] = singleton;
    }
}

/** Create a static version of the class. */
let injector = new Injector();

export { injector as Injector };
