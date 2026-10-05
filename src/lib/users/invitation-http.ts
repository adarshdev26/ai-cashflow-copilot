import { NextResponse } from 'next/server'
import { InvitationError } from '@/lib/users/invitations'

export function invitationErrorResponse(error: unknown, label: string) {
  if (error instanceof InvitationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  console.error(`${label}:`, error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}