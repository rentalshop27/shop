-- Migration: Add Date-Aware Stock Status and Future Booking Support

-- 1. Add status column to stock_items with check constraint
ALTER TABLE public.stock_items
ADD COLUMN status text NOT NULL DEFAULT 'available';

ALTER TABLE public.stock_items
ADD CONSTRAINT check_stock_item_status CHECK (status IN ('available', 'repair', 'wash'));

-- 2. Drop the existing unique open-rental index
DROP INDEX IF EXISTS rentals_one_open_rental_per_stock_item_idx;

-- 3. Create a trigger function to prevent overlapping open rentals for the same SKU
CREATE OR REPLACE FUNCTION check_rental_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('booked', 'active', 'overdue') THEN
    IF EXISTS (
      SELECT 1 FROM public.rentals
      WHERE id <> NEW.id
        AND shop_id = NEW.shop_id
        AND stock_item_sku = NEW.stock_item_sku
        AND status IN ('booked', 'active', 'overdue')
        AND pickup_date <= NEW.return_date
        AND return_date >= NEW.pickup_date
    ) THEN
      RAISE EXCEPTION 'Stock item % already has an overlapping open rental in the requested date range.', NEW.stock_item_sku;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_overlapping_rentals
BEFORE INSERT OR UPDATE ON public.rentals
FOR EACH ROW EXECUTE FUNCTION check_rental_date_overlap();
