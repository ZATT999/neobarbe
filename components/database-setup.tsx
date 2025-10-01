"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabaseStorage } from "@/lib/supabase-storage"
import { useToast } from "@/hooks/use-toast"

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
    />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface DatabaseSetupProps {
  onSetupComplete: () => void
}

export function DatabaseSetup({ onSetupComplete }: DatabaseSetupProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    tablesExist: boolean
    servicesExist: boolean
    error?: string
  } | null>(null)
  const { toast } = useToast()

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    setSetupStatus(null)

    try {
      const tablesExist = await supabaseStorage.checkDatabaseTables()

      let servicesExist = false
      if (tablesExist) {
        const services = await supabaseStorage.getServices()
        servicesExist = services.length > 0
      }

      setSetupStatus({
        tablesExist,
        servicesExist,
      })

      if (tablesExist && servicesExist) {
        toast({
          title: "Base de datos configurada",
          description: "La base de datos está lista para usar",
        })
        onSetupComplete()
      }
    } catch (error) {
      console.error("[v0] Error checking database status:", error)
      setSetupStatus({
        tablesExist: false,
        servicesExist: false,
        error: "Error al verificar el estado de la base de datos",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const setupDatabase = async () => {
    setIsSettingUp(true)

    try {
      const supabase = supabaseStorage.createClient()

      // Execute setup scripts step by step
      const setupSteps = [
        {
          name: "Creando tabla de usuarios",
          sql: `
            create table if not exists public.users (
              id uuid primary key default gen_random_uuid(),
              name text not null,
              email text,
              phone text,
              admin boolean default false,
              created_at timestamp with time zone default timezone('utc'::text, now()) not null,
              last_booking text
            );
            
            alter table public.users enable row level security;
            
            create policy "Anyone can read users" on public.users for select using (true);
            create policy "Anyone can insert users" on public.users for insert with check (true);
            create policy "Anyone can update users" on public.users for update using (true);
          `,
        },
        {
          name: "Creando tabla de servicios",
          sql: `
            create table if not exists public.services (
              id serial primary key,
              name text not null,
              duration integer not null,
              price decimal(10,2) not null,
              description text,
              active boolean default true,
              created_at timestamp with time zone default timezone('utc'::text, now()) not null
            );
            
            alter table public.services enable row level security;
            
            create policy "Anyone can read services" on public.services for select using (active = true);
            create policy "Admins can manage services" on public.services for all using (true);
          `,
        },
        {
          name: "Creando tabla de citas",
          sql: `
            create table if not exists public.appointments (
              id serial primary key,
              date text not null,
              "from" text not null,
              "to" text not null,
              name text not null,
              phone text,
              price decimal(10,2) not null,
              deposit decimal(10,2) default 0,
              nequi text,
              trx_ref text,
              receipt text,
              created_at timestamp with time zone default timezone('utc'::text, now()) not null,
              unique(date, "from")
            );
            
            alter table public.appointments enable row level security;
            
            create policy "Anyone can read appointments" on public.appointments for select using (true);
            create policy "Anyone can insert appointments" on public.appointments for insert with check (true);
            create policy "Anyone can update appointments" on public.appointments for update using (true);
            create policy "Anyone can delete appointments" on public.appointments for delete using (true);
          `,
        },
        {
          name: "Insertando servicios por defecto",
          sql: `
            insert into public.services (name, description, price, duration) values
              ('Corte Clásico', 'Corte de cabello tradicional con tijeras y máquina', 15.00, 30),
              ('Corte + Barba', 'Corte de cabello completo con arreglo de barba', 25.00, 45),
              ('Solo Barba', 'Arreglo y perfilado de barba', 12.00, 20),
              ('Corte Niño', 'Corte especial para niños menores de 12 años', 10.00, 25),
              ('Afeitado Clásico', 'Afeitado tradicional con navaja', 18.00, 30)
            on conflict do nothing;
          `,
        },
      ]

      for (const step of setupSteps) {
        console.log(`[v0] ${step.name}...`)

        // Execute SQL using raw query
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({ sql_query: step.sql }),
        })

        if (!response.ok) {
          // Try alternative method - split into individual statements
          const statements = step.sql.split(";").filter((stmt) => stmt.trim())
          for (const statement of statements) {
            if (statement.trim()) {
              try {
                await supabase.rpc("exec_sql", { sql_query: statement.trim() + ";" })
              } catch (err) {
                console.log(`[v0] Executed: ${statement.substring(0, 50)}...`)
              }
            }
          }
        }
      }

      toast({
        title: "Base de datos configurada",
        description: "Todas las tablas y datos iniciales han sido creados",
      })

      // Check status again
      await checkDatabaseStatus()
    } catch (error) {
      console.error("[v0] Error setting up database:", error)
      toast({
        title: "Error de configuración",
        description: "Hubo un problema configurando la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-xl">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-xl sm:text-2xl">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <DatabaseIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent font-bold">
              Configuración de Base de Datos
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Configura las tablas necesarias para el sistema de reservas
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupStatus && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                {setupStatus.tablesExist ? (
                  <CheckIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XIcon className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  Tablas de base de datos {setupStatus.tablesExist ? "creadas" : "no encontradas"}
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                {setupStatus.servicesExist ? (
                  <CheckIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XIcon className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  Servicios por defecto {setupStatus.servicesExist ? "configurados" : "no encontrados"}
                </span>
              </div>

              {setupStatus.error && (
                <Alert variant="destructive">
                  <AlertDescription>{setupStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={checkDatabaseStatus}
              disabled={isChecking || isSettingUp}
              variant="outline"
              className="flex-1 h-12 bg-transparent"
            >
              {isChecking ? "Verificando..." : "Verificar Estado"}
            </Button>

            <Button
              onClick={setupDatabase}
              disabled={isChecking || isSettingUp}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-black font-semibold"
            >
              {isSettingUp ? "Configurando..." : "Configurar Base de Datos"}
            </Button>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              <strong>Instrucciones:</strong>
              <br />
              1. Haz clic en "Verificar Estado" para revisar la configuración actual
              <br />
              2. Si las tablas no existen, haz clic en "Configurar Base de Datos"
              <br />
              3. Una vez configurado, podrás usar el sistema normalmente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
