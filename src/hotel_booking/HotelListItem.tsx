import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  ListRenderItemInfo,
  useWindowDimensions,
} from 'react-native';
import { Heart, MapPin, Star, StarHalf } from 'lucide-react-native';
import { HotelListType } from './model/hotel_list_data';

interface Props {
  data: ListRenderItemInfo<HotelListType>;
}

const renderRatingStars = (rating: number) => {
  const safeRating = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating - fullStars >= 0.5;

  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, index) => {
        if (index < fullStars) {
          return <Star key={`star-${index}`} color="#54D3C2" fill="#54D3C2" size={24} />;
        }

        if (index === fullStars && hasHalfStar) {
          return <StarHalf key={`star-${index}`} color="#54D3C2" fill="#54D3C2" size={24} />;
        }

        return <Star key={`star-${index}`} color="#54D3C2" size={24} />;
      })}
    </View>
  );
};

const HotelListItem: React.FC<Props> = ({ data }) => {
  const { item, index } = data;

  const { width } = useWindowDimensions();

  const translateY = useRef<Animated.Value>(new Animated.Value(50)).current;
  const opacity = useRef<Animated.Value>(new Animated.Value(0)).current;

  const imageSize = width - 48;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * (400 / 3),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * (400 / 3),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.imageContainer}>
        <Image
          style={{ height: imageSize / 2, width: imageSize }}
          source={item.imagePath}
          resizeMode="stretch"
        />
        <View style={{ position: 'absolute', right: 0, padding: 16 }}>
          <Heart size={22} color="#54D3C2" />
        </View>
      </View>
      <View style={{ padding: 8, paddingHorizontal: 16 }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Text style={styles.title}>{item.titleTxt}</Text>
          <Text style={styles.perNightPrice}>${item.perNight}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.subText}>
            <Text style={[{ marginRight: 4 }, textStyle]}>{item.subTxt}</Text>
            <MapPin size={14} color="#54D3C2" />
            <Text style={textStyle}>
              {Number(item.dist.toPrecision(2))} km to city
            </Text>
          </View>
          <Text style={styles.perNightText}>/per night</Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
          <Text style={styles.review}>{item.reviews} Reviews</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const textStyle = {
  color: 'rgba(128,128,128, 0.6)',
  fontFamily: 'WorkSans-Regular',
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginVertical: 12,
    marginHorizontal: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: 'grey',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  imageContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    color: 'black',
    fontSize: 22,
    fontFamily: 'WorkSans-SemiBold',
  },
  subText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
    marginTop: 4,
  },
  perNightPrice: {
    color: 'black',
    fontSize: 22,
    fontFamily: 'WorkSans-SemiBold',
  },
  perNightText: { ...textStyle, color: 'black', marginTop: 4 },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  review: {
    ...textStyle,
    marginLeft: 8,
  },
});

export default HotelListItem;
