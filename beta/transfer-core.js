(function(root) {
  'use strict';
  const LIMIT = 20 * 1024 * 1024;
  function keyInfo(key) {
    const match = /^(stackadoo|mathcraft)(Save|Profile):(.+)$/.exec(key);
    if (!match) return null;
    const name = match[2] === 'Save' ? match[3].split('::')[0] : match[3];
    if (!name || name.length > 120) return null;
    return {name, canonical: 'stackadoo' + match[2] + ':' + match[3], modern: match[1] === 'stackadoo'};
  }
  function fromStorage(storage) {
    const data = Object.create(null);
    let size = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i), info = keyInfo(key);
      if (!info) continue;
      const value = storage.getItem(key);
      if (typeof value !== 'string') continue;
      size += value.length;
      if (size > LIMIT) throw Error('This backup is too large for the browser beta. Your old games are unchanged.');
      data[key] = value;
    }
    return fromData(data);
  }
  function fromJSON(text) {
    if (typeof text !== 'string' || text.length > LIMIT) throw Error('Choose a Stackadoo backup smaller than 20 MB.');
    const parsed = JSON.parse(text);
    return fromData(parsed?.data || parsed);
  }
  function fromData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('This is not a Stackadoo backup.');
    // d15: the old game's keys are case-sensitive but its players were not ("Leo" and "leo" are one player in the new game),
    // so names are listed once per player, preferring the spelling of the player's profile.
    const canonical = Object.create(null), names = new Map();
    let size = 0;
    for (const [key, value] of Object.entries(data)) {
      const info = keyInfo(key);
      if (!info || typeof value !== 'string') continue;
      size += value.length;
      if (size > LIMIT) throw Error('This backup is too large for the browser beta.');
      let parsed;
      try { parsed = JSON.parse(value); } catch { throw Error('One saved player could not be read. Please keep your original backup and contact support.'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('A player record is not in the expected format.');
      if (info.modern || !Object.hasOwn(canonical, info.canonical)) canonical[info.canonical] = value;
      const id = info.name.toLowerCase(), isProfile = /Profile:/.test(info.canonical), had = names.get(id);
      if (!had || (isProfile && !had.profile) || (isProfile === had.profile && info.name < had.name)) names.set(id, {name: info.name, profile: isProfile || !!had?.profile});
    }
    if (names.size > 100) throw Error('Please choose a backup with fewer than 100 players.');
    return {data: canonical, names: [...names.values()].map(n => n.name).sort((a,b)=>a.localeCompare(b))};
  }
  // origin 'cloud' marks a copy of the parent account's old-game backup (the game then keeps only the learning history of the
  // old worlds; the cloud backup keeps the worlds themselves).
  function select(source, selectedNames, origin) {
    const names = new Set([...selectedNames].map(n => String(n).toLowerCase())), data = Object.create(null);
    if (!names.size) throw Error('Choose a player to bring first.');
    const known = new Set(source.names.map(n => n.toLowerCase()));
    for (const name of names) if (!known.has(name)) throw Error('That player was not in this backup.');
    for (const [key, value] of Object.entries(source.data)) if (names.has(keyInfo(key).name.toLowerCase())) data[key] = value;
    const out = {version:1, source:'stackadoo-web-beta-copy', data};
    if (origin) out.origin = origin;
    return JSON.stringify(out);
  }
  root.StackadooTransfer = {keyInfo, fromStorage, fromJSON, fromData, select};
})(typeof window === 'undefined' ? globalThis : window);
