import React from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import Badge from '../components/ui/Badge'

export const NotFound = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-crimson/15 border border-crimson/30 flex items-center justify-center mx-auto text-crimson">
        <Search className="w-10 h-10 animate-float" />
      </div>

      <div className="space-y-2">
        <Badge variant="crimson">404 — Dead End</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ghost">
          Case File Missing
        </h1>
      </div>

      <p className="text-muted font-serif text-base sm:text-lg leading-relaxed">
        The corridor you've turned down leads to a dark brick wall. The requested
        file or case room does not exist in our detective bureau archives.
      </p>

      <div className="pt-4">
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Headquarters
        </Link>
      </div>
    </div>
  )
}

export default NotFound
