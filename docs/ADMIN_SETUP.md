# Admin access

The panel is at `/admin`. Getting someone in is two steps, deliberately separate.

## Why two steps

A Neon Auth account answers *who are you*. A row in `app.staff` answers *may you
read the patient book*. Those are different questions, and treating the first as
an answer to the second is how every account in the auth project becomes an
administrator.

The application refuses to proxy sign-up — `/api/auth/[...path]` allowlists
`sign-in/email`, `sign-out` and `get-session`, and answers 404 to everything
else. So an account cannot be self-registered against a staff address, which is
what makes matching staff by email safe. **Do not relax one half without
revisiting the other.**

## 1. Create the account

In the Neon Console: **Auth → Users → Add user**. Set an email and a password.

## 2. Authorise the address

```bash
npm run admin:grant -- dentist@clinic.do "Dr. Francis Valerio"
```

Then check it:

```bash
npm run admin:list
```

The person can now sign in at `/admin/login`.

## Removing access

```bash
npm run admin:revoke -- someone@clinic.do
```

This sets `disabled_at` rather than deleting the row — the row is the record
that this person once had access, which is what an audit trail is for. The
application role has no `DELETE` on the table.

Their existing session stays valid until it expires. To cut it immediately,
delete the session in the Neon Console.

## What happens if you skip step 2

The person signs in successfully and lands on a page that says *"Esta cuenta no
tiene acceso"*, with a sign-out button. No panel markup, no patient data, and
nothing is served before the check runs — the guard is a server component, so
`redirect()` throws before any children render.

## Rate limiting

Sign-in is throttled at 5 attempts per 15 minutes per hashed IP, and the limiter
**fails closed**: if the counter is unreadable the attempt is refused. That does
mean a database outage locks the clinic out of the panel. It is the right trade —
being locked out for an hour is recoverable in a way a guessed password is not.

The login screen says so, so a legitimate person who mistypes twice knows to stop
rather than keep hammering.
