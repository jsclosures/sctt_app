/**
 * Asset Service
 *
 * Maps to the backend ASSET handler in handlers.js.
 * All assets are stored in Solr with contenttype: "ASSET".
 *
 * Solr document shape:
 *   id          – unique ID (e.g. "ASSET1710000000000")
 *   contenttype – always "ASSET"
 *   assetname   – display name
 *   assettype   – "script" | "other" etc.
 *   assetnotes  – base64 encoded notes text
 *   assetscript – base64 encoded script text
 */

import { restGet, restPost, toBase64, fromBase64 } from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Convert a raw Solr asset doc into a friendly object.
 * { id, name, type, notes, script }
 */
function docToAsset(doc) {
  return {
    id: doc.id,
    name: doc.assetname || '',
    type: doc.assettype || 'script',
    notes: doc.assetnotes ? fromBase64(doc.assetnotes) : '',
    script: doc.assetscript ? fromBase64(doc.assetscript) : '',
  };
}

/**
 * Convert a friendly asset object into a Solr doc for saving.
 */
function assetToDoc(asset) {
  const doc = {};

  if (asset.id) doc.id = asset.id;
  if (asset.name !== undefined) doc.assetname = asset.name;
  if (asset.type !== undefined) doc.assettype = asset.type;
  if (asset.notes !== undefined) doc.assetnotes = toBase64(asset.notes);
  if (asset.script !== undefined) doc.assetscript = toBase64(asset.script);

  return doc;
}

// ─── API calls ──────────────────────────────────────────────────────

/**
 * Fetch all assets from the backend.
 *
 * @param {number} start - page index (0-based)
 * @param {number} rows  - items per page
 * @param {string} [sort] - field to sort by
 * @param {boolean} [ascending] - sort direction
 * @returns {Promise<{ items: Array, total: number }>}
 */
export async function getAssets(start = 0, rows = 100, sort, ascending) {
  const params = {
    contenttype: 'ASSET',
    action: 'GET',
    _start: start,
    _rows: rows,
  };

  if (sort) {
    params._sort = sort;
    params._ascending = ascending;
  }

  const data = await restGet(params);

  return {
    items: (data.items || []).map(docToAsset),
    total: data._totalItems || 0,
  };
}

/**
 * Save (create or update) an asset.
 * If no id is provided, the backend auto-generates one.
 *
 * @param {{ id?, name, type, notes?, script? }} asset
 * @returns {Promise<Object>}
 */
export async function saveAsset(asset) {
  const doc = assetToDoc(asset);

  return restPost({
    contenttype: 'ASSET',
    action: 'POST',
    doc,
  });
}

/**
 * Delete an asset by its Solr document id.
 *
 * @param {string} id - Solr document ID
 * @returns {Promise<Object>}
 */
export async function deleteAsset(id) {
  return restPost({
    contenttype: 'ASSET',
    action: 'DELETE',
    doc: { id },
  });
}