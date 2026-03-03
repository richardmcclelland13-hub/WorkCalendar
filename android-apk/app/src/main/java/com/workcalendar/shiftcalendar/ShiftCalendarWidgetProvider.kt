package com.workcalendar.shiftcalendar

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.Locale

class ShiftCalendarWidgetProvider : AppWidgetProvider() {
    companion object {
        private const val PREFS_NAME = "shift_widget_prefs"
        private const val SHIFT_KEY_PREFIX = "widget_shift_"
        private const val ACTION_TOGGLE_SHIFT = "com.workcalendar.shiftcalendar.ACTION_TOGGLE_SHIFT"

        private val shifts = arrayOf("I2", "J2", "K2", "L2")
        private val pattern = arrayOf("DAY", "DAY", "DAY", "NIGHT", "NIGHT", "NIGHT", "OFF", "OFF", "OFF", "OFF", "OFF", "OFF")
        private val shiftOffsets = mapOf("I2" to 1, "J2" to 4, "K2" to 7, "L2" to 10)
        private val refDate = LocalDate.of(2026, 1, 1)

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, ShiftCalendarWidgetProvider::class.java)
            val widgetIds = manager.getAppWidgetIds(component)
            for (widgetId in widgetIds) {
                updateWidget(context, manager, widgetId)
            }
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val shift = getWidgetShift(context, widgetId)
            val today = LocalDate.now()
            val status = shiftStateForDate(shift, today)

            val views = RemoteViews(context.packageName, R.layout.widget_shift_calendar)
            views.setTextViewText(
                R.id.widgetDate,
                today.format(java.time.format.DateTimeFormatter.ofPattern("EEE, MMM d", Locale.getDefault()))
            )
            views.setTextViewText(R.id.widgetShift, shift)
            views.setTextViewText(
                R.id.widgetStatus,
                when (status) {
                    "DAY" -> "Day Shift"
                    "NIGHT" -> "Night Shift"
                    else -> "Off"
                }
            )
            views.setInt(
                R.id.widgetStatus,
                "setBackgroundResource",
                when (status) {
                    "DAY" -> R.drawable.widget_status_day
                    "NIGHT" -> R.drawable.widget_status_night
                    else -> R.drawable.widget_status_off
                }
            )

            val openIntent = Intent(context, MainActivity::class.java)
            val openPendingIntent = PendingIntent.getActivity(
                context,
                widgetId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widgetRoot, openPendingIntent)

            val toggleIntent = Intent(context, ShiftCalendarWidgetProvider::class.java).apply {
                action = ACTION_TOGGLE_SHIFT
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
            }
            val togglePendingIntent = PendingIntent.getBroadcast(
                context,
                10000 + widgetId,
                toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widgetShift, togglePendingIntent)

            manager.updateAppWidget(widgetId, views)
        }

        private fun shiftStateForDate(shift: String, date: LocalDate): String {
            val offset = shiftOffsets[shift] ?: shiftOffsets.getValue("I2")
            val delta = ChronoUnit.DAYS.between(refDate, date).toInt()
            val cycleDay = ((offset - 1 + delta) % 12 + 12) % 12
            return pattern[cycleDay]
        }

        private fun getWidgetShift(context: Context, widgetId: Int): String {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getString("$SHIFT_KEY_PREFIX$widgetId", "I2") ?: "I2"
        }

        private fun setWidgetShift(context: Context, widgetId: Int, shift: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString("$SHIFT_KEY_PREFIX$widgetId", shift).apply()
        }

        private fun clearWidgetShift(context: Context, widgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().remove("$SHIFT_KEY_PREFIX$widgetId").apply()
        }

        private fun nextShift(current: String): String {
            val index = shifts.indexOf(current).let { if (it < 0) 0 else it }
            return shifts[(index + 1) % shifts.size]
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        for (widgetId in appWidgetIds) {
            clearWidgetShift(context, widgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_TOGGLE_SHIFT) {
            val widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
            if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                val current = getWidgetShift(context, widgetId)
                setWidgetShift(context, widgetId, nextShift(current))
                updateWidget(context, AppWidgetManager.getInstance(context), widgetId)
            }
            return
        }

        if (
            intent.action == Intent.ACTION_DATE_CHANGED ||
            intent.action == Intent.ACTION_TIME_CHANGED ||
            intent.action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            updateAllWidgets(context)
        }
    }
}

