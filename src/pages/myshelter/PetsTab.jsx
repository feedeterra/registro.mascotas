import ShelterPetsPanel from '../../components/ShelterPetsPanel'

export default function PetsTab({ targetId }) {
  return (
    <div className="anim">
      <ShelterPetsPanel targetId={targetId} />
    </div>
  )
}
