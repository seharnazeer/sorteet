import { Platform } from "react-native";

export const EDFonts =
  Platform.OS == "ios" ? {
    semiBold: "CeraPro-Bold",
    bold: "CeraPro-Bold",
    medium: "CeraPro-Medium",
    regular: "CeraPro-Regular",
    light: "CeraPro-Light",
    black: "CeraPro-Black",
    boldItalic: "CeraPro-BoldItalic"
  } :
    {
      semiBold: "Cera-Pro-Bold",
      bold: "Cera-Pro-Bold",
      medium: "Cera-Pro-Medium",
      regular: "Cera-Pro-Regular",
      light: "Cera-Pro-Light",
      black: "Cera-Pro-Black",
      boldItalic: "Cera-Pro-BoldItalic"
    };