import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface MCQOptionProps {
  option: 'A' | 'B' | 'C' | 'D';
  text: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const MCQOption: React.FC<MCQOptionProps> = memo(({
  option,
  text,
  selected,
  onSelect,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.optionBadge, selected && styles.optionBadgeSelected]}>
        <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>{option}</Text>
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{text}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  containerSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E8E93',
  },
  optionLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: '500',
    color: '#007AFF',
  },
});
