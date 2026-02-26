'use client'

import { useState } from 'react'
import { Layers, Calculator, ChevronDown, ChevronUp } from 'lucide-react'

// Dados extraídos da tabela de traços padronizados
const TRACOS_PADRAO = [
    {
        traco: '1 : 1 : 2', fck_3: 22, fck_7: 30, fck_28: 40,
        cimento_kg: 514, cimento_sacos: 10.3, agua_litros: 206,
        agregados: { areia_seca: 363, areia_umida: 465, brita_1: 363, brita_2: 363 }
    },
    {
        traco: '1 : 1,5 : 3', fck_3: 18, fck_7: 25, fck_28: 35,
        cimento_kg: 387, cimento_sacos: 7.7, agua_litros: 189,
        agregados: { areia_seca: 409, areia_umida: 524, brita_1: 409, brita_2: 409 }
    },
    {
        traco: '1 : 2 : 2,5', fck_3: 14, fck_7: 20, fck_28: 30,
        cimento_kg: 374, cimento_sacos: 7.5, agua_litros: 206,
        agregados: { areia_seca: 528, areia_umida: 676, brita_1: 330, brita_2: 330 }
    },
    {
        traco: '1 : 2 : 3', fck_3: 11, fck_7: 17, fck_28: 25,
        cimento_kg: 344, cimento_sacos: 6.9, agua_litros: 210,
        agregados: { areia_seca: 486, areia_umida: 622, brita_1: 364, brita_2: 364 }
    },
    {
        traco: '1 : 2,5 : 3', fck_3: 10, fck_7: 15, fck_28: 22,
        cimento_kg: 319, cimento_sacos: 6.4, agua_litros: 207,
        agregados: { areia_seca: 562, areia_umida: 719, brita_1: 337, brita_2: 337 }
    },
    {
        traco: '1 : 2 : 4', fck_3: 9, fck_7: 13, fck_28: 21,
        cimento_kg: 297, cimento_sacos: 5.94, agua_litros: 202,
        agregados: { areia_seca: 420, areia_umida: 538, brita_1: 420, brita_2: 420 }
    },
    {
        traco: '1 : 2,5 : 3,5', fck_3: 8, fck_7: 12, fck_28: 19,
        cimento_kg: 293, cimento_sacos: 5.86, agua_litros: 208,
        agregados: { areia_seca: 517, areia_umida: 662, brita_1: 362, brita_2: 362 }
    },
    {
        traco: '1 : 2,5 : 4', fck_3: 7, fck_7: 11, fck_28: 18,
        cimento_kg: 276, cimento_sacos: 5.5, agua_litros: 201,
        agregados: { areia_seca: 487, areia_umida: 623, brita_1: 390, brita_2: 390 }
    },
    {
        traco: '1 : 2,5 : 5', fck_3: 5, fck_7: 9, fck_28: 15,
        cimento_kg: 246, cimento_sacos: 4.9, agua_litros: 195, // fator água/cimento ajustado na original
        agregados: { areia_seca: 435, areia_umida: 557, brita_1: 435, brita_2: 195 }
    },
    {
        traco: '1 : 3 : 5', fck_3: 4, fck_7: 7, fck_28: 12,
        cimento_kg: 229, cimento_sacos: 4.6, agua_litros: 202,
        agregados: { areia_seca: 486, areia_umida: 622, brita_1: 405, brita_2: 202 }
    },
    {
        traco: '1 : 3 : 6', fck_3: 3, fck_7: 5, fck_28: 10,
        cimento_kg: 208, cimento_sacos: 4.2, agua_litros: 198,
        agregados: { areia_seca: 441, areia_umida: 564, brita_1: 441, brita_2: 198 }
    },
]

export default function TracosPage() {
    const [volCalc, setVolCalc] = useState<{ traco: typeof TRACOS_PADRAO[0]; volume: string } | null>(null)
    const [expandido, setExpandido] = useState<string | null>(null)

    const calcular = (t: typeof TRACOS_PADRAO[0], vol: number) => ({
        cimento_sacos: (t.cimento_sacos * vol).toFixed(1) + ' sacos (50kg)',
        cimento_kg: (t.cimento_kg * vol).toFixed(0) + ' kg',
        areia_umida: (t.agregados.areia_umida * vol).toFixed(0) + ' Litros',
        brita_1: (t.agregados.brita_1 * vol).toFixed(0) + ' Litros',
        brita_2: (t.agregados.brita_2 * vol).toFixed(0) + ' Litros',
        agua: (t.agua_litros * vol).toFixed(0) + ' Litros',
    })

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,144,217,0.15)' }}>
                    <Layers size={20} style={{ color: '#4A90D9' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Banco de Traços</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cálculo automático de materiais</p>
                </div>
            </div>

            {/* Calculadora ativa */}
            {volCalc && (
                <div className="card space-y-3" style={{ border: '1px solid var(--green-primary)' }}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: 'var(--green-primary)' }}>
                            📐 Calculadora: Traço {volCalc.traco.traco}
                        </p>
                        <button onClick={() => setVolCalc(null)} style={{ color: 'var(--text-muted)' }}>×</button>
                    </div>

                    <div>
                        <label className="form-label">Volume total a concretar (m³)</label>
                        <input className="input" type="number" step="0.5" placeholder="Ex: 5.5" autoFocus
                            value={volCalc.volume}
                            onChange={e => setVolCalc(p => p ? { ...p, volume: e.target.value } : null)} />
                    </div>

                    {volCalc.volume && Number(volCalc.volume) > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Materiais necessários ({Number(volCalc.volume)} m³)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(calcular(volCalc.traco, Number(volCalc.volume))).map(([k, v]) => (
                                    <div key={k} className="rounded-xl p-3" style={{ background: 'rgba(127,166,83,0.1)' }}>
                                        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--green-primary)' }}>
                                            {k.replace('_', ' ')}
                                        </p>
                                        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{v}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                                * Cálculo considerando Areia Úmida (3%). Resistência esperada: {volCalc.traco.fck_28} MPa aos 28 dias.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <h2 className="section-title">Traços Padrão (Por 1 m³)</h2>

                {TRACOS_PADRAO.map(t => (
                    <div key={t.traco} className="card overflow-hidden" style={{ padding: 0 }}>
                        <div className="flex items-center justify-between p-3">
                            <div
                                className="flex-1 min-w-0"
                                onClick={() => setExpandido(expandido === t.traco ? null : t.traco)}
                            >
                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Traço {t.traco}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className="badge-info">FCK 28d: {t.fck_28} MPa</span>
                                    <span className="badge-gray">{t.cimento_sacos} sacos cimento</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
                                <button onClick={() => setVolCalc({ traco: t, volume: '' })}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(127,166,83,0.15)', color: 'var(--green-primary)' }}>
                                    <Calculator size={18} />
                                </button>
                                <button onClick={() => setExpandido(expandido === t.traco ? null : t.traco)} className="text-muted p-2">
                                    {expandido === t.traco ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Detalhes expandidos */}
                        {expandido === t.traco && (
                            <div className="p-3 pt-0 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-3">
                                    <div className="col-span-2 pb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Resistência Média (MPa)</div>
                                    <div className="flex justify-between"><span>3 dias:</span> <strong>{t.fck_3}</strong></div>
                                    <div className="flex justify-between"><span>7 dias:</span> <strong>{t.fck_7}</strong></div>

                                    <div className="col-span-2 pb-1 pt-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Consumo para 1 m³ de concreto</div>
                                    <div className="flex justify-between"><span>Cimento (kg):</span> <strong>{t.cimento_kg}</strong></div>
                                    <div className="flex justify-between"><span>Água (L):</span> <strong>{t.agua_litros}</strong></div>
                                    <div className="flex justify-between"><span>Areia Seca (L):</span> <strong>{t.agregados.areia_seca}</strong></div>
                                    <div className="flex justify-between"><span>Brita 1 (L):</span> <strong>{t.agregados.brita_1}</strong></div>
                                    <div className="flex justify-between"><span>Areia Úm. (L):</span> <strong>{t.agregados.areia_umida}</strong></div>
                                    <div className="flex justify-between"><span>Brita 2 (L):</span> <strong>{t.agregados.brita_2}</strong></div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <p className="text-center text-[10px] pt-4" style={{ color: 'var(--text-muted)' }}>
                Esta tabela utiliza como base os consumos de cimento, agregados (areia e brita) em litros por m³ de concreto conforme literaturas técnicas de dosagem empírica. A responsabilidade por ensaios e confirmação de FCK segue a NBR 12655.
            </p>
        </div>
    )
}
