"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllServices } from "@/lib/payment"

const ScissorsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm0 12c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5zM19 3l-6 6 2 2 7-7V3z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

interface ServiceSelectorProps {
  selectedService: string
  onServiceSelect: (serviceKey: string, price: number, duration: number) => void
}

export function ServiceSelector({ selectedService, onServiceSelect }: ServiceSelectorProps) {
  const services = getAllServices()

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <ScissorsIcon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold mb-2">Selecciona tu servicio</h3>
        <p className="text-sm text-muted-foreground">Elige el tipo de corte que deseas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service) => (
          <Card
            key={service.key}
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              selectedService === service.key
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onServiceSelect(service.key, service.price, service.duration)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">{service.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClockIcon className="w-4 h-4" />
                    <span>{service.duration} min</span>
                  </div>
                </div>
                {selectedService === service.key && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-primary-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                  ${service.price.toLocaleString("es-CO")} COP
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Depósito: ${Math.round(service.price * 0.5).toLocaleString("es-CO")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
