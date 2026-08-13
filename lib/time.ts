export const minutesOut=(since:string|null, now=Date.now()) => since ? Math.max(0,Math.floor((now-new Date(since).getTime())/60000)) : 0;
export const formatTime=(value:string|null) => value ? new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(value)) : '—';
export const isPriorDay=(value:string|null, now=new Date()) => !!value && new Date(value).toDateString()!==now.toDateString();
