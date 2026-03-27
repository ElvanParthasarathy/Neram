function LiveCalendarEmbed() {
  return (
    <div style={{ marginTop: "2rem" }}>
      <p>
        If there are any last-minute changes or updates, please refer to the live calendar below.
      </p>
      <iframe
        src="https://calendar.google.com/calendar/embed?src=fa963df1314b26f3cf7396c9fb93cd9b49420dfc5f92dc6392fa3ac04bd68b19%40group.calendar.google.com&ctz=Asia%2FKolkata"
        style={{ border: 0 }}
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="no"
        title="RMD Google Calendar"
      ></iframe>
    </div>
  );
}

export default LiveCalendarEmbed;
