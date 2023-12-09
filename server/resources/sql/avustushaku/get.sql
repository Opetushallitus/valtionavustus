select avustushaut.*, va_code_values.code as operational_unit_code
from hakija.avustushaut
       left join virkailija.va_code_values on avustushaut.operational_unit_id = va_code_values.id
where avustushaut.id = :id
  and status <> 'deleted'
