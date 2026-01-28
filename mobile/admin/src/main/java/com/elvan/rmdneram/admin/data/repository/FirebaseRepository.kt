package com.elvan.rmdneram.admin.data.repository

import com.elvan.rmdneram.admin.data.model.*
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.getValue
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.collections.immutable.toImmutableList
import kotlinx.collections.immutable.toImmutableMap

/**
 * Repository for accessing Firebase Realtime Database
 * Mirrors the data structure used in the React Native app
 */
class FirebaseRepository {
    
    private val database = FirebaseDatabase.getInstance()
    
    // ==================== USER PROFILE ====================
    
    /**
     * Get user profile as a Flow for real-time updates
     * Path: /users/{uid}
     */
    fun getUserProfile(uid: String): Flow<UserProfile?> = callbackFlow {
        val ref = database.getReference("users/$uid")
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val profile = snapshot.getValue<UserProfile>()
                trySend(profile)
            }
            
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }
    
    /**
     * Update user profile fields
     */
    suspend fun updateUserProfile(uid: String, updates: Map<String, Any>) {
        database.getReference("users/$uid").updateChildren(updates).await()
    }
    
    // ==================== MASTER DATA ====================
    
    /**
     * Get master schedule data (timetable, courses, exams)
     * Path: /schedules/{batch}/{dept}/{section}
     */
    fun getMasterData(batch: String, dept: String, section: String): Flow<MasterData> = callbackFlow {
        val ref = database.getReference("schedules/$batch/$dept/$section")
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val data = parseMasterData(snapshot)
                trySend(data)
            }
            
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }
    
    
    private fun parseMasterData(snapshot: DataSnapshot): MasterData {
        // Parse courses
        val courses = snapshot.child("courses").children.mapNotNull { child ->
            child.getValue<Course>()
        }.toImmutableList()
        
        // Parse timetable - Map<String, List<String>>
        val timetable = mutableMapOf<String, List<String>>()
        snapshot.child("timetable").children.forEach { daySnapshot ->
            val dayName = daySnapshot.key ?: return@forEach
            val periods = daySnapshot.children.mapNotNull { it.getValue<String>() }
            timetable[dayName] = periods
        }
        
        // Parse exams
        val exams = snapshot.child("exams").children.mapNotNull { examSnapshot ->
            val id = (examSnapshot.child("id").value as? Number)?.toLong() ?: 0L
            val title = examSnapshot.child("title").getValue<String>() ?: ""
            val type = examSnapshot.child("type").getValue<String>() ?: ""
            val startDate = examSnapshot.child("startDate").getValue<String>() ?: ""
            val endDate = examSnapshot.child("endDate").getValue<String>() ?: ""
            val subjects = examSnapshot.child("subjects").children.mapNotNull { sub ->
                sub.getValue<ExamSubject>()
            }
            
            ExamSchedule(id, title, type, startDate, endDate, subjects)
        }.toImmutableList()
        
        // Parse counseling
        val counselSnap = snapshot.child("counseling")
        val counselors = counselSnap.child("counselors").children.mapNotNull { it.getValue<String>() }
        val coordinators = mutableMapOf<String, String>()
        counselSnap.child("coordinators").children.forEach { 
            coordinators[it.key ?: ""] = it.getValue<String>() ?: ""
        }
        
        return MasterData(
            courses = courses,
            timetable = timetable.toImmutableMap(),
            exams = exams,
            counseling = CounselingData(counselors, coordinators)
        )
    }

    // ==================== UPDATES & NOTICES ====================
    
    /**
     * Get live section updates (daily notes, general notices)
     * Path: /updates/{batch}/{dept}/{section}
     */
    fun getSectionUpdates(batch: String, dept: String, section: String): Flow<SectionUpdates> = callbackFlow {
        val ref = database.getReference("updates/$batch/$dept/$section")
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val live = getLoopMap(snapshot.child("live"))
                val general = snapshot.child("general").getValue<GeneralNotice>() ?: GeneralNotice()
                
                trySend(SectionUpdates(live.toImmutableMap(), general))
            }
            
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }
    
    private fun getLoopMap(snapshot: DataSnapshot): Map<String, DailyUpdate> {
        val map = mutableMapOf<String, DailyUpdate>()
        snapshot.children.forEach { child ->
            val key = child.key ?: return@forEach
            val value = child.getValue<DailyUpdate>() ?: return@forEach
            map[key] = value
        }
        return map
    }
    
    // ==================== CALENDAR EVENTS ====================
    
    /**
     * Get academic calendar events
     * Path: /calendars/{batch}/events
     */
    fun getCalendarEvents(batch: String): Flow<List<CalendarEvent>> = callbackFlow {
        val ref = database.getReference("calendars/$batch/events")
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val events = snapshot.children.mapNotNull { 
                    val evt = it.getValue<CalendarEvent>()
                    evt?.copy(id = it.key ?: "") 
                }
                trySend(events)
            }
            
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }
}
