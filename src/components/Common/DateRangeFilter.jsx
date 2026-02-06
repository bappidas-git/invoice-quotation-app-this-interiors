import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import styles from "./dateRangeFilter.module.css";

const DateRangeFilter = ({ value, onChange, className }) => {
  const [activeFilter, setActiveFilter] = useState(value || "Last Month");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customLabel, setCustomLabel] = useState("Choose Date Range");

  const filters = ["Today", "Last Week", "Last Month", customLabel, "All"];

  useEffect(() => {
    if (value && value !== activeFilter) {
      setActiveFilter(value);
    }
  }, [value]);

  useEffect(() => {
    if (
      activeFilter !== "Choose Date Range" &&
      !activeFilter.includes(" - ")
    ) {
      setCustomLabel("Choose Date Range");
      setDateRange({ start: null, end: null });
    }
  }, [activeFilter]);

  const handleFilterClick = (filter) => {
    if (filter === customLabel && customLabel === "Choose Date Range") {
      setShowDatePicker(true);
    } else if (filter === customLabel && customLabel !== "Choose Date Range") {
      setActiveFilter(filter);
      onChange(filter, dateRange);
    } else {
      setActiveFilter(filter);
      onChange(filter, null);
    }
  };

  const handleApplyDateRange = () => {
    if (dateRange.start && dateRange.end) {
      const label = `${format(dateRange.start, "MMM dd")} - ${format(
        dateRange.end,
        "MMM dd"
      )}`;
      setCustomLabel(label);
      setActiveFilter(label);
      onChange(label, dateRange);
      setShowDatePicker(false);
    }
  };

  const handleCancelDateRange = () => {
    setShowDatePicker(false);
    if (customLabel === "Choose Date Range") {
      setDateRange({ start: null, end: null });
    }
  };

  return (
    <>
      <ButtonGroup
        variant="outlined"
        className={`${styles.dateFilterGroup} ${className || ""}`}
      >
        {filters.map((filter) => (
          <Button
            key={filter}
            onClick={() => handleFilterClick(filter)}
            className={activeFilter === filter ? styles.activeFilter : ""}
          >
            {filter}
          </Button>
        ))}
      </ButtonGroup>

      <Dialog
        open={showDatePicker}
        onClose={handleCancelDateRange}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <Box className={styles.datePickerContainer}>
            <DatePicker
              label="Start Date"
              value={dateRange.start}
              onChange={(date) => setDateRange({ ...dateRange, start: date })}
              slotProps={{ textField: { fullWidth: true } }}
              maxDate={new Date()}
            />
            <DatePicker
              label="End Date"
              value={dateRange.end}
              onChange={(date) => setDateRange({ ...dateRange, end: date })}
              slotProps={{ textField: { fullWidth: true } }}
              minDate={dateRange.start}
              maxDate={new Date()}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDateRange}>Cancel</Button>
          <Button
            onClick={handleApplyDateRange}
            variant="contained"
            disabled={!dateRange.start || !dateRange.end}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DateRangeFilter;
