T = int(input())
result = 0
# 결과 값 0으로 지정
for i in range(1, T + 1):
    lst2 = []
    # 빈 리스트 생성
    lst1 = list(map(int, input().split()))
    
for l in lst1:
    lst2.append(l)
    # lst1을 계속 input 하면서 lst2에는 lst1의 i번쨰 값을 추가
    # lst2는 세로 줄을 생성하려는 의도인데 아닌듯
for k in range (len(lst1)):
    if (lst1[k] in lst2[:k]) or (lst1[k] in lst2[k+1:]):
        continue
    else:
        result = 1
        # k를 제외한 부분에 수가 있으면 0 유지, 아니면 1로 바꿈
    if (lst2[k] in lst1[:k]) or (lst2[k] in lst1[k+1:]):
        continue
    else:
        result = 1
        # 세로줄 가로줄 같은 방식으로 중복 검증
for j in range(3):
    lst3 = []
    for jj in range(3):
        for jjj in range(3):
            lst3.append(lst1[jjj])
            lst3.append(lst2[jjj])
    if lst1 [jj] in lst3:
        continue
    if lst2[jj] in lst3:
        continue
    else:
        result = 1
    # line 23~34까지는 정사각형 모양에서 중복 검증 시도
    # 근데 코드가 너무 이상해서 집 가서 수정할 듯 합니다.

    print(f' #{T} {result}')
    # print 값은 아직 수정 필요