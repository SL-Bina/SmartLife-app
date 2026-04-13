import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  useWindowDimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronRight,
  Heart,
  MapPin,
  Search,
} from 'lucide-react-native';
import CustomerCalendar from './CalendarPopupView';
import FilterModal from './FiltersModal';
import HotelListItem from './HotelListItem';
import MyPressable from '../components/MyPressable';
import { HOTEL_LIST, HotelListType } from './model/hotel_list_data';

const HALF_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'July',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const HotelHomeScreen: React.FC = () => {
  const window = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date;
  });
  const [showCal, setShowCal] = useState<boolean>(false);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const onBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    (navigation as any).navigate('MainDrawer');
  }, [navigation]);

  const onOpenDesignCourse = useCallback(() => {
    (navigation as any).navigate('DesignCourse');
  }, [navigation]);

  const filteredHotels = React.useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    if (!query) {
      return HOTEL_LIST;
    }

    const matched = HOTEL_LIST.filter(item => {
      if (item.id === 0) {
        return true;
      }

      const title = item.titleTxt.toLowerCase();
      const subtitle = item.subTxt.toLowerCase();
      return title.includes(query) || subtitle.includes(query);
    });

    if (matched.length === 0) {
      return HOTEL_LIST.slice(0, 1);
    }

    return matched;
  }, [appliedSearch]);

  const contentHeader = (
    <View style={{ backgroundColor: 'rgb(242, 242, 242)' }}>
      <View style={{ flexDirection: 'row', padding: 16 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="London..."
          placeholderTextColor="#3c3c434c"
          selectionColor="#54D3C2"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => setAppliedSearch(searchText)}
        />
        <View style={styles.searchBtnContainer}>
          <MyPressable
            style={styles.searchBtn}
            android_ripple={{ color: 'grey', radius: 28, borderless: true }}
            touchOpacity={0.6}
            onPress={() => setAppliedSearch(searchText)}
          >
            <Search size={28} color="white" />
          </MyPressable>
        </View>
      </View>
      <View style={styles.headerDetailContainer}>
        <MyPressable
          style={styles.headerSectionContainer}
          touchOpacity={0.6}
          onPress={() => setShowCal(true)}
        >
          <Text style={styles.headerDetailTitle}>Choose date</Text>
          <Text style={styles.sectionText}>
            {`${String(startDate.getDate()).padStart(2, '0')}, ${
              HALF_MONTHS[startDate.getMonth()]
            } - ${String(endDate.getDate()).padStart(2, '0')}, ${
              HALF_MONTHS[endDate.getMonth()]
            }`}
          </Text>
        </MyPressable>
        <View style={styles.verticalDivider} />
        <View style={styles.headerSectionContainer}>
          <Text style={styles.headerDetailTitle}>Number of Rooms</Text>
          <Text style={styles.sectionText}>1 Room - 2 Adults</Text>
        </View>
      </View>

      <View style={styles.demoButtonRow}>
        <MyPressable
          style={styles.demoButton}
          touchOpacity={0.7}
          onPress={onOpenDesignCourse}
        >
          <Text style={styles.demoButtonText}>Open Design Course Demo</Text>
        </MyPressable>
      </View>
    </View>
  );

  const renderItem = useCallback(
    (data: ListRenderItemInfo<HotelListType>) =>
      data.index > 0 ? (
        <HotelListItem {...{ data }} />
      ) : (
        <View style={styles.stickyHeaderContainer}>
          <Text style={styles.hotelCountText}>530 hotels found</Text>
          <View style={{ borderRadius: 4, overflow: 'hidden' }}>
            <MyPressable
              style={{ flexDirection: 'row', padding: 8 }}
              onPress={() => setShowFilter(true)}
            >
              <Text style={styles.sectionText}>Filter</Text>
              <View style={{ paddingHorizontal: 8 }}>
                <ArrowUpDown size={20} color="#54D3C2" />
              </View>
            </MyPressable>
          </View>
        </View>
      ),
    [],
  );

  return (
    <>
      {/* Header */}
      <View
        style={[
          styles.header,
          { height: 52 + inset.top, paddingTop: inset.top },
        ]}
      >
        <View style={styles.headerLeft}>
          <MyPressable
            style={{ padding: 8 }}
            android_ripple={{ color: 'grey', radius: 20, borderless: true }}
            onPress={onBackPress}
          >
            <ArrowLeft size={22} color="black" />
          </MyPressable>
        </View>
        <View
          style={{
            marginHorizontal: 16,
            maxWidth: window.width - 16 - 32 - 41 - 74, // 16, 32:- total padding/margin; 41, 74:- left and right view's width
          }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            Explore
          </Text>
        </View>
        <View style={styles.headerRight}>
          <MyPressable
            style={styles.topCourseBtn}
            touchOpacity={0.7}
            onPress={onOpenDesignCourse}
          >
            <Text style={styles.topCourseBtnText}>Course</Text>
          </MyPressable>
          <View style={{ paddingRight: 8 }}>
            <Heart size={22} color="black" />
          </View>
          <View style={{ paddingHorizontal: 8 }}>
            <MapPin size={22} color="black" />
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <FlatList
          contentContainerStyle={[styles.list, { paddingBottom: inset.bottom }]}
          stickyHeaderIndices={[1]}
          nestedScrollEnabled
          ListHeaderComponent={contentHeader}
          data={filteredHotels}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
        />
      </View>

      <View style={[styles.quickNavWrap, { bottom: inset.bottom + 18 }]}> 
        <MyPressable
          style={styles.quickNavButton}
          touchOpacity={0.8}
          onPress={onOpenDesignCourse}
        >
          <Text style={styles.quickNavText}>Design Course</Text>
          <ChevronRight size={18} color="white" />
        </MyPressable>
      </View>

      <CustomerCalendar
        {...{ showCal, setShowCal }}
        minimumDate={new Date()}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onApplyClick={(startData, endData) => {
          if (startData != null && endData != null) {
            setStartDate(startData);
            setEndDate(endData);
          }
        }}
      />
      <FilterModal {...{ showFilter, setShowFilter }} />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'lightgrey',
  },
  headerLeft: {
    alignItems: 'flex-start',
    flexGrow: 1,
    flexBasis: 0,
  },
  headerTitle: {
    color: 'black',
    fontSize: 22,
    fontFamily: 'WorkSans-SemiBold',
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: 0,
  },
  topCourseBtn: {
    borderRadius: 10,
    backgroundColor: '#132137',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  topCourseBtnText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgb(242, 242, 242)',
  },
  list: {
    flexGrow: 1,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 16,
    color: 'black',
    fontSize: 18,
    elevation: 8,
    shadowColor: 'lightgrey',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  searchBtnContainer: {
    borderRadius: 36,
    elevation: 12,
  },
  searchBtn: {
    padding: 12,
    backgroundColor: '#54D3C2',
    borderRadius: 36,
    shadowColor: 'grey',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerDetailContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerDetailTitle: {
    color: 'darkgrey',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'WorkSans-Regular',
  },
  sectionText: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'WorkSans-Regular',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'darkgrey',
    marginRight: 8,
    marginVertical: 8,
  },
  headerSectionContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  demoButtonRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  demoButton: {
    borderRadius: 12,
    backgroundColor: '#132137',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  stickyHeaderContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  hotelCountText: {
    flex: 1,
    color: 'black',
    fontSize: 16,
    alignSelf: 'center',
    fontFamily: 'WorkSans-Regular',
  },
  quickNavWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
  },
  quickNavButton: {
    borderRadius: 999,
    backgroundColor: '#132137',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  quickNavText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
});

export default HotelHomeScreen;
