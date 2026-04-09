import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://efzyhsqvttpvolddhosj.supabase.co'
const supabaseKey = 'sb_publishable_ObWlTyZo01F12eHEhtgp_w_9xr7HcNn'

export const supabase = createClient(supabaseUrl, supabaseKey)
