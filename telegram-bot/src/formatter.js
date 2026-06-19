'use strict';

function truncateAddress(addr) {
  if (!addr || addr.length <= 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function progressBar(pct, len = 10) {
  const filled = Math.round((pct / 100) * len);
  return '█'.repeat(filled) + '░'.repeat(len - filled);
}

function formatLaunch(l) {
  const pct = l.progress ?? 0;
  return [
    `🚀 *${l.name}* (${l.symbol})`,
    `💰 Price: \`${l.price ?? 'N/A'}\` XLM`,
    `📈 Progress: ${progressBar(pct)} ${pct}%`,
    `🔑 \`${truncateAddress(l.contractId ?? l.id)}\``,
    l.description ? `📝 ${l.description}` : null,
  ].filter(Boolean).join('\n');
}

function formatStats(s) {
  return [
    `📊 *WaveMint Stats*`,
    `🎯 Total Launches: *${s.totalLaunches ?? 0}*`,
    `💧 Total Volume: *${s.totalVolume ?? 0}* XLM`,
    `✅ Migrated: *${s.migrated ?? 0}*`,
  ].join('\n');
}

function formatMigration(l) {
  return [
    `🎉 *${l.name}* (${l.symbol}) has migrated!`,
    `🌊 Now live on the DEX with full liquidity.`,
    `🔑 \`${truncateAddress(l.contractId ?? l.id)}\``,
  ].join('\n');
}

module.exports = { formatLaunch, formatStats, formatMigration, truncateAddress };
