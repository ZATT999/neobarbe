"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
)

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
)

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

interface UserRegistrationProps {
  onUserRegistered: (user: any) => void
  onAdminLogin: (isAdmin: boolean) => void
}

export function UserRegistration({ onUserRegistered, onAdminLogin }: UserRegistrationProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "El nombre es requerido"
    }
    if (name.trim().length < 2) {
      return "El nombre debe tener al menos 2 caracteres"
    }
    if (name.trim().length > 50) {
      return "El nombre no puede exceder 50 caracteres"
    }
    return null
  }

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return "El teléfono es requerido"
    }
    if (phone.trim().length < 10) {
      return "El teléfono debe tener al menos 10 dígitos"
    }
    return null
  }

  const handleRegister = async () => {
    setError("")
    setIsLoading(true)

    try {
      const nameValidation = validateName(name)
      if (nameValidation) {
        setError(nameValidation)
        setIsLoading(false)
        return
      }

      const phoneValidation = validatePhone(phone)
      if (phoneValidation) {
        setError(phoneValidation)
        setIsLoading(false)
        return
      }

      const trimmedName = name.trim()
      const trimmedPhone = phone.trim()

      const { data: existingUser, error: fetchError } = await supabase
        .from("barbershop_users")
        .select("id, nombre, telefono, admin, creado_en, rol")
        .eq("nombre", trimmedName)
        .maybeSingle()

      if (fetchError) {
        console.error("[v0] Error fetching user:", fetchError)
        throw new Error("Error al buscar usuario")
      }

      if (existingUser) {
        let isBanned = false
        let bannedReason = ""

        try {
          const { data: banCheck } = await supabase
            .from("barbershop_users")
            .select("is_banned, banned_reason")
            .eq("id", existingUser.id)
            .single()

          if (banCheck) {
            isBanned = banCheck.is_banned || false
            bannedReason = banCheck.banned_reason || ""
          }
        } catch (banError) {
          console.log("[v0] Ban columns not yet created, skipping ban check")
        }

        if (isBanned) {
          setError(`Tu cuenta ha sido suspendida. Motivo: ${bannedReason || "Contacta al administrador"}`)
          toast({
            title: "Cuenta suspendida",
            description: "No puedes acceder con esta cuenta",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const user = {
          id: existingUser.id,
          name: existingUser.nombre,
          phone: existingUser.telefono,
          admin: existingUser.admin || false,
          created_at: existingUser.creado_en,
          rol: existingUser.rol || "cliente",
          is_banned: isBanned,
        }

        onUserRegistered(user)

        if (user.admin) {
          onAdminLogin(true)
        }

        toast({
          title: "Bienvenido de vuelta",
          description: `Hola ${user.name}!`,
        })
      } else {
        const insertData: any = {
          nombre: trimmedName,
          telefono: trimmedPhone,
          admin: false,
          rol: "cliente",
        }

        const { data: newUser, error: insertError } = await supabase
          .from("barbershop_users")
          .insert([insertData])
          .select("id, nombre, telefono, admin, creado_en, rol")
          .single()

        if (insertError) {
          console.error("[v0] Error creating user:", insertError)
          throw insertError
        }

        const user = {
          id: newUser.id,
          name: newUser.nombre,
          phone: newUser.telefono,
          admin: newUser.admin || false,
          created_at: newUser.creado_en,
          rol: newUser.rol || "cliente",
          is_banned: false,
        }

        onUserRegistered(user)

        toast({
          title: "Registro exitoso",
          description: `Bienvenido ${user.name}!`,
        })
      }

      setName("")
      setPhone("")
    } catch (err) {
      console.error("[v0] Registration error:", err)
      setError("Error al registrar usuario. Intenta nuevamente.")
      toast({
        title: "Error",
        description: "No se pudo completar el registro",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      const nameValidation = validateName(name)
      if (nameValidation) {
        setError(nameValidation)
        setIsLoading(false)
        return
      }

      const password = prompt("Ingresa la contraseña de administrador:")
      if (!password) {
        setIsLoading(false)
        return
      }

      if (password !== "enrique112233") {
        setError("Contraseña de administrador incorrecta")
        toast({
          title: "Error de autenticación",
          description: "Contraseña incorrecta",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const trimmedName = name.trim()
      const trimmedPhone = phone.trim() || "N/A"

      const { data: existingAdmin, error: fetchError } = await supabase
        .from("barbershop_users")
        .select("id, nombre, telefono, admin, creado_en, rol")
        .eq("nombre", trimmedName)
        .eq("admin", true)
        .maybeSingle()

      if (fetchError) {
        console.error("[v0] Error fetching admin:", fetchError)
        throw new Error("Error al buscar administrador")
      }

      let adminUser
      if (existingAdmin) {
        adminUser = {
          id: existingAdmin.id,
          name: existingAdmin.nombre,
          phone: existingAdmin.telefono,
          admin: true,
          created_at: existingAdmin.creado_en,
          rol: "admin",
          is_banned: false,
        }
      } else {
        const insertData: any = {
          nombre: trimmedName,
          telefono: trimmedPhone,
          admin: true,
          rol: "admin",
        }

        const { data: newAdmin, error: insertError } = await supabase
          .from("barbershop_users")
          .insert([insertData])
          .select("id, nombre, telefono, admin, creado_en, rol")
          .single()

        if (insertError) {
          console.error("[v0] Error creating admin:", insertError)
          throw insertError
        }

        adminUser = {
          id: newAdmin.id,
          name: newAdmin.nombre,
          phone: newAdmin.telefono,
          admin: true,
          created_at: newAdmin.creado_en,
          rol: "admin",
          is_banned: false,
        }
      }

      onUserRegistered(adminUser)
      onAdminLogin(true)

      localStorage.setItem("barber_admin_device", "true")

      toast({
        title: "Acceso de administrador",
        description: `Bienvenido administrador ${adminUser.name}`,
      })

      setName("")
      setPhone("")
    } catch (err) {
      console.error("[v0] Admin login error:", err)
      setError("Error al iniciar sesión como administrador")
      toast({
        title: "Error de administrador",
        description: "No se pudo completar el acceso de administrador",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister()
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Acceso a NEA BARBER</h2>
        <p className="text-muted-foreground">Ingresa tus datos para reservar tu turno</p>
      </div>

      <div className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in-up">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              Nombre completo
            </Label>
            <Input
              id="name"
              placeholder="Ingresa tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="h-14 text-base bg-background border-2 focus:border-primary transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Teléfono
            </Label>
            <Input
              id="phone"
              placeholder="Ingresa tu número de teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="h-14 text-base bg-background border-2 focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleRegister}
            disabled={isLoading || !name.trim() || !phone.trim()}
            className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          >
            {isLoading ? "Registrando..." : "Ingresar"}
          </Button>
          <Button
            onClick={handleAdminLogin}
            variant="outline"
            disabled={isLoading || !name.trim()}
            className="h-14 border-2 hover:bg-primary/10 hover:border-primary text-base font-semibold transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 bg-transparent"
          >
            <ShieldIcon className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </div>

        <div className="bg-muted/50 border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            💡 <strong>Usuarios existentes:</strong> Solo ingresa tu nombre para acceder a tu cuenta
          </p>
        </div>
      </div>
    </div>
  )
}
