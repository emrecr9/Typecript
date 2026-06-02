import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Shift } from "../types";

interface ShiftCardProps {
  shift: Shift;
  actionButton: React.ReactNode;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, actionButton }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        overflow: "visible",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, primary.main, primary.light)",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "primary.main",
          }}
        >
          workplaceId={shift.workplaceId}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            start={shift.startAt}, end={shift.endAt}
          </Typography>
        </Box>
        {actionButton}
      </CardContent>
    </Card>
  );
};

export default ShiftCard;
