"use strict";

(function () {
  const weekdays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const pad = (number) => String(number).padStart(2, "0");

  function makeReminder(day, time, now, pageUrl) {
    if ((day !== "daily" && !weekdays.includes(day)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error("曜日と時刻を選んでください。");
    }
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(now);
    start.setHours(hours, minutes, 0, 0);
    if (start <= now) start.setDate(start.getDate() + 1);
    if (day !== "daily") start.setDate(start.getDate() + (weekdays.indexOf(day) - start.getDay() + 7) % 7);
    const local = String(start.getFullYear()) + pad(start.getMonth() + 1) + pad(start.getDate()) + "T" + pad(hours) + pad(minutes) + "00";
    const stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = new URL(pageUrl);
    url.search = "";
    url.hash = "home";
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shikaku no Tane//Study Reminder//JA", "BEGIN:VEVENT",
      "UID:study-" + day + "-" + hours + "-" + minutes + "@shikaku-no-tane", "DTSTAMP:" + stamp,
      "DTSTART:" + local, "DURATION:PT3M", "RRULE:FREQ=" + (day === "daily" ? "DAILY" : "WEEKLY;BYDAY=" + day),
      "SUMMARY:資格のタネで1問", "DESCRIPTION:いつもの木から1問だけ。",
      ...(/^https?:$/.test(url.protocol) ? ["URL:" + url.href] : []),
      "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:資格のタネで1問",
      "END:VALARM", "END:VEVENT", "END:VCALENDAR"
    ];
    // The variable URL is ASCII after URL serialization. Fold long content lines for calendar import.
    return lines.map((line) => line.length <= 75 ? line :
      line.slice(0, 75) + "\r\n " + line.slice(75).match(/.{1,74}/g).join("\r\n ")).join("\r\n") + "\r\n";
  }

  if (typeof module === "object" && module.exports) module.exports = { makeReminder };
  if (typeof document === "undefined") return;
  const form = document.getElementById("study-reminder");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const contents = makeReminder(form.elements.day.value, form.elements.time.value, new Date(), location.href);
    const blobUrl = URL.createObjectURL(new Blob([contents], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "shikaku-no-tane.ics";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    document.getElementById("study-reminder-status").textContent = "保存した予定をカレンダーに取り込んでください。通知の変更や停止もカレンダーでできます。";
  });
})();
