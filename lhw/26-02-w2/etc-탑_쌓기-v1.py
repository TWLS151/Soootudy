# IM
# 탑 쌓기
# TTP: 27'

import sys
sys.stdin = open('build_tower.txt')

import itertools

TC = int(input())

for test_case in range(1, TC+1):
    baggage_num, height1, height2 = map(int, input().split())
    weight = list(map(int, input().split()))

    weight.sort()
    # 높이1, 높이2 의 크기만큼 나눠 담아야하는데
    # 무작위로 골라 담아낸다.
    # itertools 의 combinations 메서드를 활용해 조합
    lst = list(itertools.combinations(weight, height1))
		# 결과 담아둘 리스트
    mul_lst = []
		# 조합 순회
    for i in lst:
		    # 한 조합 내 결과 담아둘 리스트
        add_lst = []
        # 높이 초기화
        height11 = height1
        height22 = height2
        # 무게 리스트를 순회하며
        for w in weight:
		        # 만들어진 조합 안에 있으면 1번 탑에 들어가는 화물
            # 정렬해두었으니 가장 가벼운 화물일 것이고
            # 가장 가벼운 화물은 가장 높은 층과 곱해야한다.
            # 가장 높은 층은 가장 가벼운 화물이 들어갔으니
            # 다음에 오는 화물은 그 아래층으로 가야해서 높이 -1
            if w in i:
                add_lst.append(w*height11)
                height11 -= 1
            # 만들어진 조합 안에 없으면 2번 탑에 들어가는 화물
            else:
                add_lst.append(w*height22)
                height22 -= 1
				# 출력
        mul_lst.append(sum(add_lst))


    print(min(mul_lst))    