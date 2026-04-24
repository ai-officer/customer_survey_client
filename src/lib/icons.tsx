import React from 'react';
import {
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon,
  Bars3Icon,
  BellIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  HandThumbUpIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  StarIcon,
  TrashIcon,
  UserCircleIcon,
  UserMinusIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const make = (Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>) =>
  React.forwardRef<SVGSVGElement, IconProps>(({ size = 16, style, ...rest }, ref) => (
    <Icon
      ref={ref as React.Ref<SVGSVGElement>}
      {...rest}
      style={{ width: size, height: size, flexShrink: 0, ...(style ?? {}) }}
    />
  ));

// Re-exported under their lucide-react names so consumers only need to swap
// the import path. New icons should still be imported from this module.
export const AlertCircle = make(ExclamationCircleIcon);
export const Archive = make(ArchiveBoxIcon);
export const ArrowLeft = make(ArrowLeftIcon);
export const BarChart3 = make(ChartBarIcon);
export const Bell = make(BellIcon);
export const Building2 = make(BuildingOffice2Icon);
export const Calendar = make(CalendarIcon);
export const Check = make(CheckIcon);
export const CheckCircle2 = make(CheckCircleIcon);
export const ChevronDown = make(ChevronDownIcon);
export const ChevronRight = make(ChevronRightIcon);
export const ChevronUp = make(ChevronUpIcon);
export const ClipboardCheck = make(ClipboardDocumentCheckIcon);
export const ClipboardList = make(ClipboardDocumentListIcon);
export const Clock = make(ClockIcon);
export const Copy = make(DocumentDuplicateIcon);
export const CopyPlus = make(DocumentPlusIcon);
export const Download = make(ArrowDownTrayIcon);
export const Edit2 = make(PencilSquareIcon);
export const ExternalLink = make(ArrowTopRightOnSquareIcon);
export const Eye = make(EyeIcon);
export const EyeOff = make(EyeSlashIcon);
export const GripVertical = make(EllipsisVerticalIcon);
export const KeyRound = make(KeyIcon);
export const LayoutDashboard = make(Squares2X2Icon);
export const LogOut = make(ArrowRightStartOnRectangleIcon);
export const Mail = make(EnvelopeIcon);
export const Menu = make(Bars3Icon);
export const MessageSquare = make(ChatBubbleLeftIcon);
export const PieChart = make(ChartPieIcon);
export const Plus = make(PlusIcon);
export const QrCode = make(QrCodeIcon);
export const Save = make(DocumentArrowDownIcon);
export const Search = make(MagnifyingGlassIcon);
export const Send = make(PaperAirplaneIcon);
export const Settings2 = make(Cog6ToothIcon);
export const Shield = make(ShieldCheckIcon);
export const Star = make(StarIcon);
export const ThumbsUp = make(HandThumbUpIcon);
export const Trash2 = make(TrashIcon);
export const TrendingUp = make(ArrowTrendingUpIcon);
export const UserRound = make(UserCircleIcon);
export const UserX = make(UserMinusIcon);
export const Users = make(UsersIcon);
export const X = make(XMarkIcon);
