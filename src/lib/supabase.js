import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const signUp = (email, password, fullName) =>
  supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export async function getItems(userId, filters = {}) {
  let q = supabase.from('clothing_items').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (filters.category && filters.category !== 'Tous') q = q.eq('category', filters.category)
  if (filters.status) q = q.eq('status', filters.status)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addItem(userId, item, imageFile) {
  let image_url = null
  let image_path = null
  if (imageFile) {
    const ext = 'jpg'
    const path = userId + '/' + Date.now() + '.' + ext
    const { error: uploadError } = await supabase.storage
      .from('clothing-images')
      .upload(path, imageFile, { contentType: 'image/jpeg' })
    if (uploadError) throw uploadError
    image_path = path
    const { data: urlData } = supabase.storage.from('clothing-images').getPublicUrl(path)
    image_url = urlData.publicUrl
  }
  const { data, error } = await supabase.from('clothing_items')
    .insert({ ...item, user_id: userId, image_url, image_path })
    .select().single()
  if (error) throw error
  return data
}

export async function updateItem(itemId, updates) {
  const { data, error } = await supabase.from('clothing_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId).select().single()
  if (error) throw error
  return data
}

export async function deleteItem(item) {
  if (item.image_path) {
    await supabase.storage.from('clothing-images').remove([item.image_path])
  }
  const { error } = await supabase.from('clothing_items').delete().eq('id', item.id)
  if (error) throw error
}

export async function getOutfits(userId) {
  const { data, error } = await supabase.from('outfits').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveOutfit(userId, outfit) {
  const { data, error } = await supabase.from('outfits')
    .insert({ ...outfit, user_id: userId }).select().single()
  if (error) throw error
  return data
}

export async function deleteOutfit(outfitId) {
  const { error } = await supabase.from('outfits').delete().eq('id', outfitId)
  if (error) throw error
}

export async function toggleFavoriteOutfit(outfitId, isFavorite) {
  const { data, error } = await supabase.from('outfits')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', outfitId).select().single()
  if (error) throw error
  return data
}

export async function getHistory(userId, limit = 30) {
  const { data, error } = await supabase.from('outfit_history').select('*')
    .eq('user_id', userId).order('worn_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export async function logOutfit(userId, entry) {
  const { data, error } = await supabase.from('outfit_history')
    .insert({ ...entry, user_id: userId }).select().single()
  if (error) throw error
  if (entry.item_ids?.length) {
    await supabase.rpc('increment_worn_count', {
      p_item_ids: entry.item_ids,
      p_outfit_id: entry.outfit_id || null
    })
  }
  return data
}

export async function getWishlist(userId) {
  const { data, error } = await supabase.from('wishlist').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addWishlistItem(userId, item) {
  const { data, error } = await supabase.from('wishlist')
    .insert({ ...item, user_id: userId }).select().single()
  if (error) throw error
  return data
}

export async function updateWishlistItem(itemId, updates) {
  const { data, error } = await supabase.from('wishlist')
    .update(updates).eq('id', itemId).select().single()
  if (error) throw error
  return data
}

export async function deleteWishlistItem(itemId) {
  const { error } = await supabase.from('wishlist').delete().eq('id', itemId)
  if (error) throw error
}

export async function getStats(userId) {
  const [itemsRes, historyRes, outfitsRes] = await Promise.all([
    supabase.from('clothing_items').select('id, category, times_worn, last_worn_at, status, created_at').eq('user_id', userId),
    supabase.from('outfit_history').select('worn_at, item_ids').eq('user_id', userId).order('worn_at', { ascending: false }).limit(90),
    supabase.from('outfits').select('id, times_worn, is_favorite').eq('user_id', userId)
  ])
  return {
    items: itemsRes.data || [],
    history: historyRes.data || [],
    outfits: outfitsRes.data || []
  }
}

export async function getColorCombinations(userId) {
  const { data, error } = await supabase.from('color_combinations').select('*').eq('user_id', userId)
  if (error) throw error
  return data || []
}

export async function saveColorCombination(userId, color, compatibleColors) {
  const { data, error } = await supabase.from('color_combinations')
    .upsert({ user_id: userId, color, compatible_colors: compatibleColors, updated_at: new Date().toISOString() }, { onConflict: 'user_id,color' })
    .select().single()
  if (error) throw error
  return data
}
