import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

const DB_NAME = 'NeramMobile.db';
const TABLE_NAME = 'kv_store';

export const DatabaseService = {
    db: null,

    /**
     * Initialize the database and create the KV table if not exists.
     */
    initialize: async () => {
        try {
            if (!DatabaseService.db) {
                DatabaseService.db = await SQLite.openDatabase({
                    name: DB_NAME,
                    location: 'default', // 'Documents' on iOS, App Database directory on Android
                });
            }

            await DatabaseService.executeQuery(
                `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at INTEGER
        );`
            );

            // DB initialized
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    },

    /**
     * Execute a raw SQL query.
     */
    executeQuery: async (sql, params = []) => {
        try {
            if (!DatabaseService.db) {
                await DatabaseService.initialize();
            }
            return await DatabaseService.db.executeSql(sql, params);
        } catch (error) {
            console.error('Query execution failed:', sql, error);
            throw error;
        }
    },

    /**
     * Get a value from the KV store.
     * Returns parsed JSON object or null.
     */
    get: async (key) => {
        const results = await DatabaseService.executeQuery(
            `SELECT value FROM ${TABLE_NAME} WHERE key = ? LIMIT 1`,
            [key]
        );

        if (results && results[0] && results[0].rows && results[0].rows.length > 0) {
            const item = results[0].rows.item(0);
            try {
                return JSON.parse(item.value);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    /**
     * Save a value to the KV store.
     * Serializes object to JSON string.
     */
    set: async (key, value) => {
        const jsonValue = JSON.stringify(value);
        const timestamp = Date.now();

        try {
            if (!DatabaseService.db) {
                await DatabaseService.initialize();
            }

            await DatabaseService.db.transaction((tx) => {
                tx.executeSql(
                    `INSERT OR REPLACE INTO ${TABLE_NAME} (key, value, updated_at) VALUES (?, ?, ?);`,
                    [key, jsonValue, timestamp]
                );
            });
        } catch (e) {
            console.error(`[DB] Save Error for ${key}`, e);
        }
    },

    /**
     * Remove a value from the store.
     */
    remove: async (key) => {
        await DatabaseService.executeQuery(
            `DELETE FROM ${TABLE_NAME} WHERE key = ?`,
            [key]
        );
    },

    /**
     * Clear all data (e.g., on logout).
     */
    clearAll: async () => {
        await DatabaseService.executeQuery(`DELETE FROM ${TABLE_NAME}`);
    },
};
