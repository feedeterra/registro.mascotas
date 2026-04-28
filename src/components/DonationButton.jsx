import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../theme'
import { Utensils } from 'lucide-react'
import { DonationModal } from './ui/DonationModal'
import { useShelterConfigContext } from '../context/ShelterConfigContext'

export default function DonationButton({ shelterSlug, petName, label = "Donar un plato", style, className, as = 'button' }) {
  const T = useT()
  const ctx = useShelterConfigContext()
  const currentShelterSlug = ctx?.shelter?.slug
  const currentAccounts = ctx?.config?.transfer_accounts || []
  
  const [isOpen, setIsOpen] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [shelterName, setShelterName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const slug = shelterSlug || currentShelterSlug
    if (!slug) return
    
    setIsOpen(true)
    
    if (slug === currentShelterSlug && currentAccounts.length > 0) {
      setAccounts(currentAccounts)
      setShelterName(ctx?.shelter?.name || 'Refugio')
      return
    }
    
    setLoading(true)
    try {
      const { data: shelter } = await supabase.from('shelters').select('id, name').eq('slug', slug).single()
      if (shelter?.id) {
        setShelterName(shelter.name)
        const { data } = await supabase.from('shelter_config').select('transfer_accounts').eq('shelter_id', shelter.id).single()
        setAccounts(Array.isArray(data?.transfer_accounts) ? data.transfer_accounts : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <>
      <Utensils size={as === 'a' ? 16 : 14} /> {label}
    </>
  )

  return (
    <>
      {as === 'a' ? (
        <a href="#" onClick={handleClick} className={className} style={style}>
          {content}
        </a>
      ) : (
        <button onClick={handleClick} className={className} style={style}>
          {content}
        </button>
      )}
      <DonationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        accounts={accounts}
        shelterName={shelterName}
        loading={loading}
      />
    </>
  )
}
