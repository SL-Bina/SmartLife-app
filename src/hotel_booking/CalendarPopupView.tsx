import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import CustomCalendar from './CustomCalendar';
import MyPressable from '../components/MyPressable';

interface Props {
  showCal: boolean;
  setShowCal: any;
  minimumDate: Date | null;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  onApplyClick: (startData: Date | null, endData: Date | null) => void;
}

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

const WEEKS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomerCalendar: React.FC<Props> = ({
  showCal,
  setShowCal,
  minimumDate,
  initialStartDate,
  initialEndDate,
  onApplyClick,
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const formattedDate = (date: Date | null) => {
    return date
      ? `${WEEKS[date?.getDay()]}, ${String(date.getDate()).padStart(2, '0')} ${
          HALF_MONTHS[date.getMonth()]
        }`
      : '--/--';
  };

  return (
    <Modal
      visible={showCal}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={() => setShowCal(false)}
    >
      <TouchableWithoutFeedback
        style={{ flex: 1 }}
        onPress={() => setShowCal(false)}
      >
        <SafeAreaView style={styles.containerStyle}>
          <BlurView
            style={{ ...StyleSheet.absoluteFillObject }}
            blurType="light"
            blurAmount={25}
            reducedTransparencyFallbackColor="white"
          />
          <TouchableWithoutFeedback style={{ flex: 1 }} onPress={() => {}}>
            <View style={styles.sheetCard}>
              <View style={{ flexDirection: 'row' }}>
                <View style={styles.timelineContainerStyle}>
                  <Text style={styles.fromToTextStyle}>From</Text>
                  <Text style={styles.startEndDateTextStyles}>
                    {formattedDate(startDate)}
                  </Text>
                </View>
                <View style={styles.verticleDivider} />
                <View style={styles.timelineContainerStyle}>
                  <Text style={styles.fromToTextStyle}>To</Text>
                  <Text style={styles.startEndDateTextStyles}>
                    {formattedDate(endDate)}
                  </Text>
                </View>
              </View>
              <View style={{ height: 0.5, backgroundColor: 'lightgrey' }} />

              <CustomCalendar
                minDate={minimumDate}
                startDate={startDate}
                endDate={endDate}
                startEndDateChange={(startDateData, endDateData) => {
                  setStartDate(startDateData);
                  setEndDate(endDateData);
                }}
              />

              <View style={styles.applyBtnShadow}>
                <View style={styles.applyBtnContainer}>
                  <MyPressable
                    style={styles.applyBtn}
                    touchOpacity={0.6}
                    onPress={() => {
                      onApplyClick(startDate, endDate);
                      setShowCal(false);
                    }}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </MyPressable>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0, 0.5)',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  sheetCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '92%',
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
  },
  timelineContainerStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromToTextStyle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Regular',
    color: 'rgba(128, 128, 128, 0.8)',
    marginBottom: 4,
  },
  startEndDateTextStyles: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  applyBtnContainer: {
    backgroundColor: '#54D3C2',
    borderRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  applyBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  applyBtnShadow: {
    backgroundColor: '#54D3C2',
    borderRadius: 24,
    margin: 16,
    marginTop: 8,
    shadowColor: 'grey',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  applyBtnText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'WorkSans-Medium',
  },
  verticleDivider: {
    height: 74,
    width: 1,
    backgroundColor: 'grey',
    opacity: 0.4,
  },
});

export default CustomerCalendar;
