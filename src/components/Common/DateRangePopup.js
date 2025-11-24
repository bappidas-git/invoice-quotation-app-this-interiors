import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const DateRangePopup = ({ open, onClose, onApply }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleApply = () => {
    if (startDate && endDate) {
      onApply({ startDate, endDate });
      onClose();
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleClear} startIcon={<Icon icon="mdi:close" />}>
            Clear
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={!startDate || !endDate}
            startIcon={<Icon icon="mdi:check" />}
          >
            Apply
          </Button>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};

export default DateRangePopup;
