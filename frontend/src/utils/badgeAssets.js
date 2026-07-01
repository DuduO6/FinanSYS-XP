import aprendizBadge from '../assets/Badges/Badge Aprendiz.png'
import controladorBadge from '../assets/Badges/Badge controlador.png'
import especialistaBadge from '../assets/Badges/Badge especialista.png'
import estrategistaBadge from '../assets/Badges/Badge estrategista.png'
import inicianteBadge from '../assets/Badges/Badge Iniciante.png'
import investidorBadge from '../assets/Badges/Badge investidor.png'
import magnataBadge from '../assets/Badges/Badge Magnata.png'
import mentorBadge from '../assets/Badges/Badge Mentor.png'
import organizadorBadge from '../assets/Badges/Badge  Organizador.png'
import planejadorBadge from '../assets/Badges/Badge planejador.png'
import poupadorBadge from '../assets/Badges/Badge poupador.png'

const BADGES_BY_LEVEL_CLASS = {
  'Iniciante Financeiro': inicianteBadge,
  'Aprendiz Financeiro': aprendizBadge,
  Organizador: organizadorBadge,
  Planejador: planejadorBadge,
  Controlador: controladorBadge,
  Poupador: poupadorBadge,
  Investidor: investidorBadge,
  Estrategista: estrategistaBadge,
  'Especialista Financeiro': especialistaBadge,
  'Mentor Financeiro': mentorBadge,
  'Magnata Financeiro': magnataBadge,
}

export function getBadgeAsset(levelClass) {
  return BADGES_BY_LEVEL_CLASS[levelClass] || inicianteBadge
}
