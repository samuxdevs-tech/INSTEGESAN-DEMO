import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react'

interface NavbarProps {
  onGoHome?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome }) => {
  const { user, impersonatedUser, stopImpersonation, logout, activePeriod } = useAuth()

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white sticky top-0 z-40 no-print">
      {/* Barra de Impersonación */}
      {impersonatedUser && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-sm font-semibold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <span>Viendo como: <strong>{impersonatedUser.nombre}</strong></span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1.5 bg-slate-950 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-800 transition active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Coordinación
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <img
            src="/escudo_transparente.png"
            alt="Escudo IE General Santander"
            className="w-10 h-10 object-contain flex-shrink-0 drop-shadow"
          />
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-slate-100 group-hover:text-white transition">
              IE General Santander
            </h1>
            <p className="text-xs text-slate-400">
              Preinformes Académicos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activePeriod && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
              {activePeriod.activo ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-slate-200 font-medium">{activePeriod.nombre}</span>
            </div>
          )}

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">
              {impersonatedUser ? impersonatedUser.nombre : user?.nombre}
            </p>
            <p className="text-[11px] text-slate-400">
              {impersonatedUser ? 'Docente (Auditado)' : user?.rol === 'ADMIN' ? 'Coordinación' : 'Docente'}
            </p>
          </div>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
