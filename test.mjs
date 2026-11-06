import dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log('URL leída:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function probarConexion() {
  console.log('⌛ Probando conexión con Supabase...')
  
  // Hacemos una consulta rápida a una tabla genérica o de sistema
  const { data, error } = await supabase.from('_dummy_test').select('*').limit(1)

  // Si da error de tabla no existe pero no de red, significa que SÍ conectó
  if (error && error.code === '42P01') {
    console.log('✅ ¡Conexión exitosa con Supabase! (La red respondió correctamente)')
  } else if (error) {
    console.log('ℹ️ Respuesta del servidor:', error.message)
    console.log('✅ ¡La conexión con Supabase se estableció!')
  } else {
    console.log('✅ ¡Conexión exitosa con Supabase!', data)
  }
}

probarConexion()