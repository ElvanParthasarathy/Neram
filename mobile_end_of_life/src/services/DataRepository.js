import { ref, get } from 'firebase/database';
import { db } from './firebase';
import { DatabaseService } from './DatabaseService';

export const DataRepository = {
    /**
     * Initialize the Repository (and Database).
     */
    initialize: async () => {
        await DatabaseService.initialize();
    },

    /**
     * User Profile
     */
    getLocalUserProfile: async () => {
        return await DatabaseService.get('user_profile');
    },

    saveUserProfile: async (profile) => {
        await DatabaseService.set('user_profile', profile);
    },

    /**
     * Master Data (Courses, Timetable, Exams)
     * Key will be dynamic based on batch/dept/section to avoid collisions if user changes.
     */
    getLocalMasterData: async (batch, dept, section) => {
        const key = `master_data_${batch}_${dept}_${section}`;
        return await DatabaseService.get(key);
    },

    saveMasterData: async (batch, dept, section, data) => {
        const key = `master_data_${batch}_${dept}_${section}`;
        await DatabaseService.set(key, data);
    },

    /**
     * Calendar Events
     */
    getLocalCalendar: async (batch) => {
        const key = `calendar_${batch}`;
        return await DatabaseService.get(key);
    },

    saveCalendar: async (batch, data) => {
        const key = `calendar_${batch}`;
        await DatabaseService.set(key, data);
    },

    /**
     * Section Updates
     */
    getLocalSectionUpdates: async (batch, dept, section) => {
        const key = `updates_${batch}_${dept}_${section}`;
        return await DatabaseService.get(key);
    },

    saveSectionUpdates: async (batch, dept, section, data) => {
        const key = `updates_${batch}_${dept}_${section}`;
        await DatabaseService.set(key, data);
    },

    /**
     * Helper to clear all data
     */
    clearAll: async () => {
        await DatabaseService.clearAll();
    }
};
