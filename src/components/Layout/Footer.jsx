// import React from "react";
// import { Box, Typography } from "@mui/material";
// import styles from "./layout.module.css";

// const Footer = () => {
//   const currentYear = new Date().getFullYear();

//   return (
//     <Box component="footer" className={styles.footer}>
//       <Typography variant="body2" color="textSecondary">
//         © {currentYear} THIS Interiors. All rights reserved.
//       </Typography>
//     </Box>
//   );
// };

// export default Footer;

import React from "react";
import { Box, Typography, Container } from "@mui/material";
import { Icon } from "@iconify/react";
import styles from "./layout.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" className={styles.footer}>
      <Container maxWidth="lg">
        <Box className={styles.footerContent}>
          <Typography variant="body2" className={styles.footerText}>
            © {currentYear} THIS Interiors. All rights reserved.
          </Typography>
          <Box className={styles.footerDivider}>|</Box>
          <Typography variant="body2" className={styles.footerText}>
            Invoice & Performa Management System v1.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
