import { MilestoneTask, ProjectInfo } from '../types';
import { getTodayDateString } from './date';

export interface CalendarEventData {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isOverdue?: boolean;
  daysOverdue?: number;
  trade?: string;
  contractorName?: string;
  contractorPhone?: string;
  progress?: number;
  isCritical?: boolean;
}

/**
 * Calculate overdue days between target end date and today
 */
export function getDaysDiff(fromStr: string, toStr: string): number {
  try {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Filter today's active tasks and overdue tasks from all milestones
 */
export function getCalendarSyncTasks(
  milestones: MilestoneTask[],
  todayStr: string = getTodayDateString()
): {
  todayTasks: CalendarEventData[];
  overdueTasks: CalendarEventData[];
  upcomingTasks: CalendarEventData[];
} {
  const todayTasks: CalendarEventData[] = [];
  const overdueTasks: CalendarEventData[] = [];
  const upcomingTasks: CalendarEventData[] = [];

  milestones.forEach((m) => {
    // 依使用者需求：廠商備料備貨不列入現場工程施工催辦與行事曆
    if (m.actionType === '備料') return;

    const isCompleted = m.progress === 100 || m.status === '已完成';
    const isOverdue = !isCompleted && m.endDate < todayStr;
    const isTodayActive = !isCompleted && m.startDate <= todayStr && m.endDate >= todayStr;
    const daysOverdue = isOverdue ? getDaysDiff(m.endDate, todayStr) : 0;

    const baseEvent: CalendarEventData = {
      id: m.id,
      title: isOverdue 
        ? `🚨【工期逾期催辦】${m.trade} - ${m.name} (已逾期 ${daysOverdue} 天)` 
        : `🔨【施工進度】${m.trade} - ${m.name}`,
      description: [
        `工種類別：${m.trade} (${m.actionType})`,
        `工項名稱：${m.name}`,
        `目前施工進度：${m.progress}% (${m.status})`,
        `預定工期：${m.startDate} 至 ${m.endDate}`,
        isOverdue ? `⚠️ 逾期警示：已超出預定完工日 ${daysOverdue} 天，請立即聯繫工班協調加速施作！` : '',
        m.isCriticalPath ? `🔥 關鍵要徑 (Critical Path)：影響後續完工時程，需優先督導！` : '',
        m.location ? `施作位置：${m.location}` : '',
        m.contractorName ? `負責工班：${m.contractorName} ${m.contractorPhone ? `(${m.contractorPhone})` : ''}` : '',
        m.description ? `作業細節備註：${m.description}` : '',
        m.designerNotes ? `📐 設計師交辦/變更：${m.designerNotes}` : '',
        `案場：翔生資訊 辦公室裝潢工程 (台中市西屯區朝富路 誠豐金融大樓 10F)`
      ].filter(Boolean).join('\n'),
      location: m.location 
        ? `誠豐金融大樓 10F (${m.location})` 
        : '台中市西屯區朝富路 誠豐金融大樓 10F',
      startDate: m.startDate,
      endDate: m.endDate,
      isOverdue,
      daysOverdue,
      trade: m.trade,
      contractorName: m.contractorName,
      contractorPhone: m.contractorPhone,
      progress: m.progress,
      isCritical: m.isCriticalPath
    };

    if (isOverdue) {
      overdueTasks.push(baseEvent);
    }
    if (isTodayActive) {
      todayTasks.push(baseEvent);
    }

    // Upcoming within 3 days
    if (!isCompleted && m.startDate > todayStr) {
      const daysToStart = getDaysDiff(todayStr, m.startDate);
      if (daysToStart <= 3) {
        upcomingTasks.push(baseEvent);
      }
    }
  });

  return { todayTasks, overdueTasks, upcomingTasks };
}

/**
 * Generate a Google Calendar 1-click web event creation URL
 */
export function generateGoogleCalendarUrl(
  event: CalendarEventData,
  alarmTime?: 'morning' | 'current'
): string {
  // Format dates: YYYYMMDD for all-day events
  // Note: in Google Calendar all-day event format, end date is exclusive, so add 1 day
  const sParts = event.startDate.split('-');
  const eParts = event.endDate.split('-');
  
  let startCal = sParts.join('');
  let endCal = eParts.join('');

  // If start and end are same or multi-day all-day event, Google Calendar end date is exclusive
  try {
    const endDateObj = new Date(event.endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endY = endDateObj.getFullYear();
    const endM = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endD = String(endDateObj.getDate()).padStart(2, '0');
    endCal = `${endY}${endM}${endD}`;
  } catch {
    endCal = startCal;
  }

  const titlePrefix = event.isOverdue ? '🚨 [逾期警告] ' : '🔨 ';
  const text = encodeURIComponent(`${titlePrefix}${event.title}`);
  const details = encodeURIComponent(event.description);
  const location = encodeURIComponent(event.location);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startCal}/${endCal}&details=${details}&location=${location}`;
}

/**
 * Generate an RFC 5545 iCalendar (.ics) format string
 */
export function generateICSContent(
  events: CalendarEventData[],
  projectInfo?: ProjectInfo
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const formatICSDate = (dateStr: string, isEnd = false) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (isEnd) {
        // iCal all-day DTEND is exclusive
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
      }
      return `${parts[0]}${parts[1]}${parts[2]}`;
    }
    return dateStr.replace(/-/g, '');
  };

  const escapeICS = (str: string) => {
    return (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const vEvents = events.map((evt) => {
    const dtStart = formatICSDate(evt.startDate);
    const dtEnd = formatICSDate(evt.endDate, true);
    const summary = escapeICS(evt.title);
    const desc = escapeICS(evt.description);
    const loc = escapeICS(evt.location);

    // Add Alarm for reminders (e.g. 15 minutes before or 08:30 on the day)
    return [
      'BEGIN:VEVENT',
      `UID:${evt.id}-${evt.startDate}@shangsheng-office`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      `STATUS:${evt.isOverdue ? 'CONFIRMED' : 'CONFIRMED'}`,
      evt.isCritical ? 'PRIORITY:1' : 'PRIORITY:5',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${evt.isOverdue ? '【緊急逾期通知】此工項已超出預定完工時限，請儘速追蹤' : '【今日施工提醒】今日排定工程進行中'}`,
      'TRIGGER:-PT30M',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:案場每日晨間 08:30 施工進度確認',
      'TRIGGER;RELATED=START:-P1D',
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//翔生資訊//辦公室裝潢工程行事曆同步//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:翔生資訊 辦公室裝潢工程排程與逾期預警',
    'X-WR-TIMEZONE:Asia/Taipei',
    ...vEvents,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Trigger download of ICS file in browser
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
