import { Image, StyleSheet, View } from "react-native";

type BrandLogoProps = {
  size?: "small" | "large";
};

export default function BrandLogo({ size = "large" }: BrandLogoProps) {
  return (
    <View style={styles.wrapper}>
      <Image
        source={require("../../assets/images/focusnest-logo-full.png")}
        style={size === "large" ? styles.logoLarge : styles.logoSmall}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },

  logoLarge: {
    width: 220,
    height: 165,
  },

  logoSmall: {
    width: 140,
    height: 105,
  },
});
