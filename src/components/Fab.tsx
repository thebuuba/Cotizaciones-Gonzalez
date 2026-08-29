import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
export function Fab() { return <Link className="fab" to="/cotizaciones/nueva" aria-label="Nueva cotización"><Plus aria-hidden="true"/></Link> }
