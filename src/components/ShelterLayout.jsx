import { Outlet, useParams } from 'react-router-dom'
import { ShelterConfigContext } from '../context/ShelterConfigContext'
import { useShelterPublicConfig } from '../hooks/useShelterConfig'

export default function ShelterLayout() {
  const { slug } = useParams()
  // Retrieve config specifically for this branch of the URL
  const configData = useShelterPublicConfig(slug)

  return (
    <ShelterConfigContext.Provider value={configData}>
      {/* Outlet renders /r/:slug/adoptar, /r/:slug/sponsors, etc. */}
      <Outlet />
    </ShelterConfigContext.Provider>
  )
}
