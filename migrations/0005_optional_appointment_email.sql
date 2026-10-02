-- =============================================================================
-- 0005_optional_appointment_email — an appointment request without an email
-- =============================================================================
-- The booking band promised "su nombre, un teléfono y el motivo. No hace falta
-- nada más", and the form beneath it refused to send without an email address.
-- The clinic confirms every request by TELEPHONE — `phone` is the field the
-- request is actually actioned through — and a large share of the patients an
-- implant practice serves are past sixty and do not use email. Requiring one
-- turned away exactly the people the site is for, to collect a value nothing
-- in the application ever sends to.
--
-- So the column becomes nullable. NULL, not the empty string: "the patient did
-- not give one" is an absence, and `WHERE email IS NULL` must be able to find
-- it. The server action writes NULL for an empty field.
--
-- The existing CHECK (length(email) <= 255) needs no change: length(NULL) is
-- NULL, and a CHECK only rejects a row whose expression is FALSE.
--
-- DROP NOT NULL is a catalog-only change: no table rewrite and no scan, so it
-- is safe on a table the public form is inserting into.
--
-- ORDER OF DEPLOYMENT MATTERS. Apply this BEFORE deploying the code that ships
-- with it. The new form lets a patient leave email empty; against a database
-- that still has NOT NULL, that insert fails and the patient is shown an error
-- after filling in the whole form.
-- =============================================================================

ALTER TABLE app.appointments
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN app.appointments.email IS
  'Optional since 0005. The clinic confirms every request by phone; NULL means the patient did not give an email.';
